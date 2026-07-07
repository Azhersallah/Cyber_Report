import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, VerticalAlign, PageOrientation, PageBreak } from 'docx';
import { AppState } from '../types';
import html2canvas from 'html2canvas';

export const exportPhotosToWord = async (state: AppState): Promise<Blob> => {
  // Find all page elements
  const pageElements = document.querySelectorAll('.a4-page, .a4-page-landscape');
  
  if (pageElements.length === 0) {
    throw new Error('No pages to export');
  }

  const paragraphs: (Paragraph)[] = [];

  // Capture each page as image
  for (let i = 0; i < pageElements.length; i++) {
    const pageElement = pageElements[i] as HTMLElement;
    
    try {
      // Check if landscape
      const isLandscape = pageElement.classList.contains('a4-page-landscape');
      
      // Hide non-printable elements temporarily
      const noPrintElements = pageElement.querySelectorAll('.no-print');
      noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');

      // Fix image stretching issue in html2canvas
      // html2canvas doesn't properly handle object-fit: contain
      // So we need to manually calculate and apply the correct dimensions
      const images = pageElement.querySelectorAll('img');
      const imageStyles: Array<{
        element: HTMLImageElement;
        originalStyle: string;
        originalWidth: string;
        originalHeight: string;
        originalMaxWidth: string;
        originalMaxHeight: string;
        originalObjectFit: string;
        parent: HTMLElement | null;
      }> = [];
      
      images.forEach((img) => {
        const htmlImg = img as HTMLImageElement;
        const parent = htmlImg.parentElement;
        
        // Store original styles
        imageStyles.push({
          element: htmlImg,
          originalStyle: htmlImg.style.cssText,
          originalWidth: htmlImg.style.width,
          originalHeight: htmlImg.style.height,
          originalMaxWidth: htmlImg.style.maxWidth,
          originalMaxHeight: htmlImg.style.maxHeight,
          originalObjectFit: htmlImg.style.objectFit,
          parent: parent,
        });
        
        // If the image has object-fit: contain, we need to manually size it
        const computedStyle = window.getComputedStyle(htmlImg);
        if (computedStyle.objectFit === 'contain' && parent) {
          const parentRect = parent.getBoundingClientRect();
          const imgNaturalWidth = htmlImg.naturalWidth;
          const imgNaturalHeight = htmlImg.naturalHeight;
          
          if (imgNaturalWidth > 0 && imgNaturalHeight > 0) {
            const parentAspect = parentRect.width / parentRect.height;
            const imgAspect = imgNaturalWidth / imgNaturalHeight;
            
            let newWidth: number;
            let newHeight: number;
            
            if (imgAspect > parentAspect) {
              // Image is wider - fit to width
              newWidth = parentRect.width;
              newHeight = parentRect.width / imgAspect;
            } else {
              // Image is taller - fit to height
              newHeight = parentRect.height;
              newWidth = parentRect.height * imgAspect;
            }
            
            // Apply the calculated dimensions
            htmlImg.style.width = `${newWidth}px`;
            htmlImg.style.height = `${newHeight}px`;
            htmlImg.style.maxWidth = 'none';
            htmlImg.style.maxHeight = 'none';
            htmlImg.style.objectFit = 'fill'; // Change to fill since we've sized it correctly
          }
        }
      });

      // Capture page as canvas at very high quality
      const canvas = await html2canvas(pageElement, {
        scale: 4, // Very high quality for A4 print
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        scrollX: 0,
        scrollY: 0,
      });

      // Restore no-print elements
      noPrintElements.forEach(el => (el as HTMLElement).style.display = '');
      
      // Restore original image styles
      imageStyles.forEach(({ element, originalStyle }) => {
        element.style.cssText = originalStyle;
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();
      const imageBuffer = new Uint8Array(arrayBuffer);

      // A4 dimensions in EMUs (English Metric Units)
      // 1 inch = 914400 EMUs
      // A4 = 210mm x 297mm = 8.268" x 11.693" = 7562400 x 10687200 EMUs
      const a4WidthEmu = 7562400;
      const a4HeightEmu = 10687200;
      
      // Use full A4 size in EMUs
      const imageWidth = isLandscape ? a4HeightEmu : a4WidthEmu;
      const imageHeight = isLandscape ? a4WidthEmu : a4HeightEmu;

      paragraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: {
                width: Math.round(imageWidth / 9525), // Convert EMU to points (1 point = 9525 EMU)
                height: Math.round(imageHeight / 9525),
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 0,
            after: 0,
            line: 0,
          },
          indent: {
            left: 0,
            right: 0,
          },
        })
      );

      // Add page break after each page except the last
      if (i < pageElements.length - 1) {
        paragraphs.push(
          new Paragraph({
            children: [new PageBreak()],
            spacing: {
              before: 0,
              after: 0,
            },
          })
        );
      }
    } catch (err) {
      console.error(`Failed to capture page ${i + 1}:`, err);
      // Add error message instead of image
      paragraphs.push(
        new Paragraph({
          text: `[Error capturing page ${i + 1}]`,
          alignment: AlignmentType.CENTER,
        })
      );
    }
  }

  // Check if we have any landscape pages
  const hasLandscape = Array.from(document.querySelectorAll('.a4-page-landscape')).length > 0;
  
  // Create document with zero margins and proper page size
  // Important: Each page needs its own section if there are mixed orientations
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
            size: {
              width: 11906,
              height: 16838,
              orientation: PageOrientation.PORTRAIT,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  // Generate blob
  const blob = await Packer.toBlob(doc);
  return blob;
};
