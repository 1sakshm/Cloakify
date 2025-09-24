import cv2, os
from typing import Tuple, Optional
class ImageSteganography:
    def __init__(self):
        self.delimiter = "####END####"
    def _string_to_binary(self, text: str) -> str:
        return ''.join(format(ord(char), '08b') for char in text)
    def _binary_to_string(self, binary: str) -> str:
        chars = []
        for i in range(0, len(binary), 8):
            byte = binary[i:i+8]
            if len(byte) == 8:
                chars.append(chr(int(byte, 2)))
        return ''.join(chars)
    def _modify_pixel(self, pixel_value: int, bit: str) -> int:
        pixel_binary = format(pixel_value, '08b')
        modified_binary = pixel_binary[:-1] + bit
        return int(modified_binary, 2)
    def _extract_lsb(self, pixel_value: int) -> str:
        return format(pixel_value, '08b')[-1]
    
    def hide_message(self, image_path: str, message: str, output_path: str) -> bool:
        try:
            image = cv2.imread(image_path)
            if image is None:
                print(f"Error: Could not read image from {image_path}")
                return False
            message_with_delimiter = message + self.delimiter
            binary_message = self._string_to_binary(message_with_delimiter)
            image_capacity = image.shape[0] * image.shape[1] * image.shape[2]
            message_length = len(binary_message)
            if message_length > image_capacity:
                print(f"Error: Message too long for image. Message needs {message_length} bits, image can hold {image_capacity} bits.")
                return False
            binary_index = 0
            rows, cols, channels = image.shape
            for i in range(rows):
                for j in range(cols):
                    for k in range(channels):
                        if binary_index < message_length:
                            image[i][j][k] = self._modify_pixel(image[i][j][k], binary_message[binary_index])
                            binary_index += 1
                        else:
                            break
                    if binary_index >= message_length:
                        break
                if binary_index >= message_length:
                    break
            success = cv2.imwrite(output_path, image)
            if success:
                print(f"Message successfully hidden in {output_path}")
                return True
            else:
                print(f"Error: Could not save image to {output_path}")
                return False
        except Exception as e:
            print(f"Error during hiding: {e}")
            return False
    
    def extract_message(self, stego_image_path: str) -> Optional[str]:
        try:
            image = cv2.imread(stego_image_path)
            if image is None:
                print(f"Error: Could not read image from {stego_image_path}")
                return None
            binary_message = ""
            rows, cols, channels = image.shape
            for i in range(rows):
                for j in range(cols):
                    for k in range(channels):
                        binary_message += self._extract_lsb(image[i][j][k])
            extracted_text = self._binary_to_string(binary_message)
            delimiter_index = extracted_text.find(self.delimiter)
            if delimiter_index != -1:
                message = extracted_text[:delimiter_index]
                print("Message successfully extracted!")
                return message
            else:
                print("Error: Could not find message delimiter. The image might not contain a hidden message.")
                return None
        except Exception as e:
            print(f"Error during extraction: {e}")
            return None
    
    def get_image_info(self, image_path: str) -> None:
        try:
            image = cv2.imread(image_path)
            if image is None:
                print(f"Error: Could not read image from {image_path}")
                return
            rows, cols, channels = image.shape
            total_pixels = rows * cols * channels
            max_chars = total_pixels // 8
            print(f"\nImage Information:")
            print(f"Dimensions: {cols} x {rows} x {channels}")
            print(f"Total pixels: {total_pixels}")
            print(f"Maximum message length: {max_chars} characters")
        except Exception as e:
            print(f"Error getting image info: {e}")
def main():
    stego = ImageSteganography()
    print("=== Image Steganography Tool ===")
    print("1. Hide message in image")
    print("2. Extract message from image")
    print("3. Get image capacity info")
    print("4. Exit")
    while True:
        choice = input("\nEnter your choice (1-4): ").strip()
        if choice == '1':
            image_path = input("Enter path to cover image: ").strip()
            if not os.path.exists(image_path):
                print("Error: Image file not found!")
                continue
            message = input("Enter message to hide: ").strip()
            if not message:
                print("Error: Message cannot be empty!")
                continue
            output_path = input("Enter output path for stego image: ").strip()
            stego.hide_message(image_path, message, output_path)
        elif choice == '2':
            stego_path = input("Enter path to stego image: ").strip()
            if not os.path.exists(stego_path):
                print("Error: Stego image file not found!")
                continue
            message = stego.extract_message(stego_path)
            if message:
                print(f"\nExtracted message: '{message}'")
        elif choice == '3':
            image_path = input("Enter path to image: ").strip()
            if not os.path.exists(image_path):
                print("Error: Image file not found!")
                continue
            stego.get_image_info(image_path)
        elif choice == '4':
            print("Goodbye!")
            break
        else:
            print("Invalid choice! Please enter 1-4.")
if __name__ == "__main__":
    main()