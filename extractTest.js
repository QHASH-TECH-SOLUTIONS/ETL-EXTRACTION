const fs = require('fs').promises;
const path = require('path');
const Tesseract = require('tesseract.js');

let extractedText;

const filePath = 'output.txt';

async function extractTextFromImages(folderPath, outputFile = 'output.txt') {
    try {
        // Read all files in the folder
        const files = await fs.readdir(folderPath);
        
        // Filter for image files (jpg, jpeg, png, gif)
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|gif)$/i.test(file)
        );

        if (imageFiles.length === 0) {
            console.warn(`No image files found in ${folderPath}`);
            return;
        }

        let allExtractedText = '';

        // Process each image
        for (const file of imageFiles) {
            const imagePath = path.join(folderPath, file);
            console.log(`Processing: ${file}`);

            try {
                // Extract text using Tesseract
                const { data: { text } } = await Tesseract.recognize(
                    imagePath,
                    'eng', // English language
                    {
                        logger: m => console.log(`${file}: ${m.status}`)
                    }
                );

                // Add extracted text with file info and separator
                allExtractedText += `File: ${file}\n${text}\n---\n`;
            } catch (error) {
                console.error(`Error processing ${file}:`, error);
                allExtractedText += `File: ${file}\nError extracting text: ${error.message}\n---\n`;
            }
        }

        // Write all text to output file
        await fs.writeFile(outputFile, allExtractedText.trim(), 'utf8');
        console.log(`Text extracted from ${imageFiles.length} images and saved to ${outputFile}`);

    } catch (error) {
        console.error('Error in extractTextFromImages:', error);
        throw error;
    }
}

// Example usage
async function main() {
    try {
        await extractTextFromImages('extracted_images');
    } catch (error) {
        console.error('Main execution failed:', error);
    }
}
main()