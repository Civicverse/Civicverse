import sys
from PIL import Image

# Enhanced ASCII characters for better depth
ASCII_CHARS = ["@", "#", "8", "&", "o", ":", "*", ".", " "]

def resize_image(image, new_width=100):
    width, height = image.size
    ratio = height / width / 1.65
    new_height = int(new_width * ratio)
    resized_image = image.resize((new_width, new_height))
    return resized_image

def grayify(image):
    grayscale_image = image.convert("L")
    return grayscale_image

def pixels_to_ascii(image):
    pixels = image.getdata()
    # Invert for dark mode compatibility in many editors
    characters = "".join([ASCII_CHARS[pixel // 32] for pixel in pixels])
    return characters

def main(image_path, new_width=100):
    try:
        image = Image.open(image_path)
    except Exception as e:
        print(f"Error: {e}")
        return

    new_image_data = pixels_to_ascii(grayify(resize_image(image, new_width)))
    pixel_count = len(new_image_data)
    ascii_image = "\n".join([new_image_data[index:(index + new_width)] for index in range(0, pixel_count, new_width)])
    print(ascii_image)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 100)
    else:
        print("Usage: python ascii_gen.py <image_path> <width>")
