# LSB Steganography Tool

A web-based steganography application that allows you to hide secret messages inside images using the Least Significant Bit (LSB) technique and decrypt them securely.

## 🔒 Features

- **Hide Messages**: Embed secret text messages into image files
- **Extract Messages**: Decrypt and retrieve hidden messages from images
- **LSB Steganography**: Uses the robust Least Significant Bit algorithm
- **Web Interface**: User-friendly browser-based application
- **Secure Processing**: All processing happens client-side for privacy
- **Multiple Formats**: Support for common image formats (PNG recommended)

## 🛠️ How It Works

### LSB Steganography Explained

Least Significant Bit (LSB) steganography works by modifying the least significant bits of pixel values in an image to encode secret data. Since these changes are minimal, they're virtually undetectable to the human eye.

1. **Encoding Process**: 
   - Convert the secret message to binary
   - Replace the least significant bits of image pixels with message bits
   - Generate a modified image that looks identical to the original

2. **Decoding Process**:
   - Extract the least significant bits from image pixels
   - Convert the binary data back to readable text
   - Retrieve the hidden message


## 📖 Usage

### Hiding a Message

1. Upload an image file (PNG, JPEG, or BMP)
2. Enter your secret message in the text area
3. Click "Encode & Download" to embed the text into the image
4. Download the modified image (appears identical to original)

### Extracting a Message

1. Upload an image containing a hidden message
2. Click "Extract Message" to decrypt the hidden text
3. View the revealed secret message

## 🏗️ Project Structure

```
lsb-steganography/
├── index.html          # Main application page
├── styles.css          # Styling
├── script.js           # Backend
├── steg.py             # Python alternative
└── README.md           # Project documentation
```

## 🔐 Security Considerations

- All processing happens client-side - no data is sent to external servers
- Original images are not modified, only copies are created
- Messages are embedded using standard LSB techniques
- No encryption is applied to the message itself (consider adding encryption for sensitive data)

## 📚 Algorithm Details

The LSB steganography implementation:

1. **Message Preparation**: Converts text to binary representation
2. **Pixel Modification**: Alters the least significant bit of RGB channels
3. **Capacity Check**: Ensures the image can hold the entire message
4. **Extraction**: Reconstructs the message from modified pixels

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License

## ⚠️ Disclaimer

This tool is for educational and legitimate privacy purposes only. Users are responsible for complying with applicable laws and regulations regarding data hiding and privacy.


## 🏷️ Tags

`steganography` `lsb` `javascript` `image-processing` `privacy` `security` `web-app`

---

**Made with ❤️ for digital privacy**