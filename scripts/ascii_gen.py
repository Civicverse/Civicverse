import sys
from PIL import Image, ImageFilter, ImageOps

def generate_outline_ascii(image_path, new_width=100, threshold=100):
    try:
        # Load image and convert to grayscale
        image = Image.open(image_path).convert("L")
        
        # Resize maintaining aspect ratio
        width, height = image.size
        ratio = height / width / 1.65
        new_height = int(new_width * ratio)
        image = image.resize((new_width, new_height))

        # Edge detection
        edges = image.filter(ImageFilter.FIND_EDGES)
        
        # Thresholding to get a clean outline
        # Invert if the background is dark, but usually we want black edges on white
        # We want the logo itself to be characters and the rest to be spaces.
        pixels = edges.getdata()
        
        ascii_chars = []
        for pixel in pixels:
            if pixel > threshold:
                ascii_chars.append("#")
            else:
                ascii_chars.append(" ")
        
        ascii_str = "".join(ascii_chars)
        ascii_image = "\n".join([ascii_str[index:(index + new_width)] for index in range(0, len(ascii_str), new_width)])
        return ascii_image

    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        path = sys.argv[1]
        width = int(sys.argv[2]) if len(sys.argv) > 2 else 100
        print(generate_outline_ascii(path, width))
    else:
        print("Usage: python ascii_gen.py <image_path> <width>")
