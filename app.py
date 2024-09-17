from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
import os
from colorthief import ColorThief
from PIL import Image
import numpy as np
import random
import colorsys

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])


def generate_random_palette():
    base_hue = random.uniform(0, 1)
    # Generate a color scheme based on color seed
    scheme = []
    seed = random.randint(1, 4)
    
    if seed == 1:
        hue_offsets = [0, 0.05, -0.05]  # Small shifts in hue for analogous colors
    elif seed == 2:
        hue_offsets = [0, 0.5]  # Complementary colors (opposite on the color wheel)
    elif seed == 3:
        hue_offsets = [0, 1/3, 2/3]  # Triadic colors (evenly spaced around the wheel)
    else:
        hue_offsets = [0]  # Default, monochromatic scheme

    # Generate base colors
    for offset in hue_offsets:
        hue = (base_hue + offset) % 1.0  # Ensure hue stays within [0, 1]
        for _ in range(2):  # Create 2 variations for each base hue
            saturation = random.uniform(0, 1)  # Expand saturation range to allow for less vibrant colors
            lightness = random.uniform(0.2, 0.8)  # Expand lightness range to avoid extremes
            color = colorsys.hsv_to_rgb(hue, saturation, lightness)
            scheme.append(rgb_to_hex(color))
    
    # If fewer than 5 colors are generated, add variations
    while len(scheme) < 5:
        # Duplicate an existing color and vary it slightly
        color_hsv = rgb_to_hsv(hex_to_rgb(scheme[-1]))  # Take the last color generated
        new_lightness = min(1, max(0, color_hsv[2] + random.uniform(-0.4, 0.4)))  # Vary lightness slightly
        new_saturation = min(1, max(0, color_hsv[1] + random.uniform(-0.4, 0.4)))  # Vary saturation slightly
        new_color = colorsys.hsv_to_rgb(color_hsv[0], new_saturation, new_lightness)
        scheme.append(rgb_to_hex(new_color))
    
    return scheme[:5]  # Always return exactly 5 colors

def rgb_to_hex(rgb):
    """Convert RGB values to Hex format."""
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]*255), int(rgb[1]*255), int(rgb[2]*255))

def rgb_to_hexa(rgb):
    """Convert RGB values to Hex format."""
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])


def rgb_to_hsv(rgb):
    """Convert RGB to HSV."""
    return colorsys.rgb_to_hsv(*rgb)


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def get_brightness(hex_color):
    r, g, b = hex_to_rgb(hex_color)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255

def find_color_positions(image, colors, tolerance=15):
    np_image = np.array(image.convert('RGB'))
    null = {'x': 0, 'y': 0}
    color_positions = {color: null for color in colors}  # Initialize with None for no match found

    def color_distance(c1, c2):
        return np.sqrt(np.sum((np.array(c1) - np.array(c2)) ** 2))

    for color in colors:
        target_rgb = hex_to_rgb(color)
        found = False
        for x in range(0,np_image.shape[1],10):
            if found:
                break  # Exit the loop if a match has been found
            for y in range(0,np_image.shape[0],10):
                pixel_color = tuple(np_image[y, x])
                if color_distance(pixel_color, target_rgb) <= tolerance:
                    color_positions[color] = {'x': int(x), 'y': int(y)}
                    found = True
                    x+=10
                    y+=10
                    break
    return color_positions


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        color_thief = ColorThief(filepath)
        palette = color_thief.get_palette(color_count=5)
        colors = [rgb_to_hexa(color) for color in palette]
        
        # Find color positions
        image = Image.open(filepath)
        color_positions = find_color_positions(image, colors)
        
        # Sort colors by brightness (from lightest to darkest)
        sorted_colors = sorted(colors, key=get_brightness, reverse=True)
        sorted_color_positions = {color: color_positions[color] for color in sorted_colors}
        
        os.remove(filepath)  # Remove the file after processing

        return jsonify({'colors': sorted_color_positions})
    
@app.route('/generate-random-palette', methods=['GET'])
def generate_random_palette_route():
    random_palette = generate_random_palette()
    return jsonify({'colors': random_palette})

if __name__ == '__main__':
    app.run(debug=True,port=5000)