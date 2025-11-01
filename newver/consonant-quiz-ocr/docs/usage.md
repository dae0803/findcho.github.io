# Usage Instructions for the Consonant Quiz OCR Project

## Overview
The Consonant Quiz OCR project is designed to capture screen content and automatically extract answers for consonant quizzes using Optical Character Recognition (OCR). This document provides guidance on how to use the application effectively.

## Prerequisites
Before using the application, ensure you have the following:
- A modern web browser that supports screen capture and WebRTC.
- Access to the internet for loading necessary libraries and resources.

## Setup
1. **Clone the Repository**
   Clone the project repository to your local machine using the following command:
   ```
   git clone https://github.com/yourusername/consonant-quiz-ocr.git
   ```

2. **Install Dependencies**
   Navigate to the project directory and install the required dependencies:
   ```
   cd consonant-quiz-ocr
   npm install
   ```

3. **Open the Application**
   Open the `src/index.html` file in your web browser. You can do this by double-clicking the file or using a local server.

## Using the Application
1. **Start Screen Capture**
   - Click the "Start Capture" button to begin capturing your screen. You may need to grant permission for the browser to access your screen.

2. **Select the Quiz Area**
   - Once the capture starts, you can select the area of the screen where the quiz question appears. If no area is selected, the entire screen will be captured.

3. **Process the Captured Image**
   - After selecting the area, the application will automatically process the captured image using OCR to extract the text.

4. **View Results**
   - The extracted text will be displayed on the screen. The application will attempt to match the extracted text with the answers in the `src/database.csv` file.

5. **Copy Answers**
   - You can copy the matched answers to your clipboard using the provided buttons.

## Troubleshooting
- If the OCR does not return expected results, ensure that the text is clear and legible.
- Check the console for any error messages if the application does not function as expected.

## Contribution
Feel free to contribute to the project by submitting issues or pull requests on GitHub.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.