import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import path from "path";
import fs from "fs";

// Configure AWS SDK with IAM user credentials
const extractTextFromImage = async (req, res, next) => {
  const s3Client = new S3Client({
    region: 'us-west-1', // Update with your AWS region
    credentials: {
      accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
      secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
    },
  });

  const textractClient = new TextractClient({
    region: 'us-west-1', // Update with your AWS region
    credentials: {
      accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
      secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log('Reading file path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, req.file.filename);

    // Log the resolved file path
    console.log('Resolved file path:', filePath);

    const fileContent = fs.readFileSync(filePath);
    console.log(fileContent);

    // Upload file to S3
    const s3Params = {
      Bucket: 'qucikbook-imgs-bucket',
      Key: `uploads/${req.file.filename}`,
      Body: fileContent,
      ContentType: req.file.mimetype,
    };

    const s3Command = new PutObjectCommand(s3Params);
    const s3Data = await s3Client.send(s3Command);
    console.log(`File uploaded successfully. Key: ${s3Params.Key}`);
    console.log(`File uploaded successfully. Bucket: ${s3Params.Bucket}`);
    
    const resolvedRegion = await s3Client.config.region();
    
    const imageUrl = `https://${s3Params.Bucket}.s3.${resolvedRegion}.amazonaws.com/${s3Params.Key}`;
    console.log('Image URL:', imageUrl);
    // Analyze the document with Amazon Textract
    const textractParams = {
      Document: {
        S3Object: {
          Bucket: s3Params.Bucket,
          Name: s3Params.Key,
        },
      },
    };

    const textractCommand = new DetectDocumentTextCommand(textractParams);
    const textractData = await textractClient.send(textractCommand);

    // Extract Blocks from Textract response
    const blocks = textractData.Blocks;

    // Process WORD and LINE blocks
    const text = blocks
      .filter(block => block.BlockType === 'LINE')
      .map(block => block.Text);

    // Log the extracted text
    console.log('Extracted Text:', JSON.stringify(text, null, 2));

    // Send response with extracted text data
    req.body.extractedText = text;
    req.body.imgUrl = imageUrl;
    next();

  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('An error occurred.');
  }
};

export default extractTextFromImage;
