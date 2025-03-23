const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-poppler');

async function extractImagesFromPdf(pdfPath, outputFolder) {
    try {
        // Verify PDF exists
        await fs.access(pdfPath).catch(() => {
            throw new Error(`PDF file not found at: ${pdfPath}`);
        });

        // Create output folder if it doesn't exist
        await fs.mkdir(outputFolder, { recursive: true });

        // Configuration for pdf-poppler
        const opts = {
            format: 'png',
            out_dir: outputFolder,
            out_prefix: 'page',  // Base name for output files
            page: null,         // null means all pages
            scale: 2048         // Resolution (adjust as needed)
        };

        // Convert PDF to images
        await pdf.convert(pdfPath, opts);

        // Rename files to match desired format (1.png, 2.png, etc.)
        const files = await fs.readdir(outputFolder);
        let imageCount = 0;

        for (const file of files) {
            if (file.endsWith('.png')) {
                imageCount++;
                const oldPath = path.join(outputFolder, file);
                const newPath = path.join(outputFolder, `${imageCount}.png`);
                await fs.rename(oldPath, newPath);
                console.log(`Saved page ${imageCount} as ${newPath}`);
            }
        }

        if (imageCount === 0) {
            throw new Error('No images extracted from PDF');
        }

        console.log(`Extracted ${imageCount} images to ${outputFolder}`);
    } catch (error) {
        console.error(`Error extracting images: ${error.message}`);
        throw error;
    }
}

async function main() {
    const pdfFile = path.resolve('pdfs/sample.pdf');
    const outputDir = path.resolve('extracted_images');
    
    console.log(`Processing PDF: ${pdfFile}`);
    console.log(`Output directory: ${outputDir}`);
    
    await extractImagesFromPdf(pdfFile, outputDir);
}

main().catch(err => console.error('Main error:', err));