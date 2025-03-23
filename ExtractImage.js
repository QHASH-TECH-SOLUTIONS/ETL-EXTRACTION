const Tesseract = require('tesseract.js');
const fs = require('fs');

/**
 * Extracts text from an image using Tesseract.js.
 * @param {string} imagePath - Path to the image file.
 * @returns {Promise<string>} - Extracted text as a string.
 */
async function extractTextFromImage(imagePath) {
  try {
    console.log('Extracting text from image...');

    // Perform OCR on the image
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng', // Language (English)
      {
        logger: (info) => console.log(info), // Optional: Log progress
      }
    );

    console.log('Text extraction complete.');
    return text; // Return the extracted text
  } catch (error) {
    console.error('Error during text extraction:', error);
    throw error; // Re-throw the error for handling in the calling function
  }
}


export async function extractAndSaveText() {
    const imagePath = 'extracted_images/1.png'; // Path to the image
const outputFilePath = 'output.txt'; // Path to the output text file
  try {
    // Extract text from the image
    const extractedText = await extractTextFromImage(imagePath);

    // Write the extracted text to the output file
    fs.writeFile(outputFilePath, extractedText, (err) => {
      if (err) {
        console.error('Failed to write to output file:', err);
      } else {
        console.log(`Extracted text successfully written to ${outputFilePath}`);
      }
    });
  } catch (error) {
    console.error('Failed to extract and save text:', error);
  }
}
