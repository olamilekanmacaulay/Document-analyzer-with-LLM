# Document Summarizer

A NestJS-based application that summarizes documents and extracts metadata using Google's Gemini AI.

## Features

- **Multi-format Support**: Extracts text from PDF (`pdf-parse`) and DOCX (`mammoth`) files.
- **AI Integration**: Uses Google's Gemini 2.0 Flash model via `@google/generative-ai` for summarization and metadata extraction.
- **File Uploads**: Handles file uploads efficiently using `multer`.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory and add your Gemini API key and Database configuration:
    ```env
    GEMINI_API_KEY=your_api_key_here
    
    # Database Configuration
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=document_summarizer
    ```

3.  **Run the Application**:
    ```bash
    # Development
    npm run start:dev

    # Production
    npm run start:prod
    ```

## Usage

### Upload Document
**POST** `/documents/upload`
- **Body**: `form-data` with key `file` (PDF or DOCX).
- **Response**: Returns the document ID.

### Analyze Document
**POST** `/documents/:id/analyze`
- **Params**: `id` (Document ID returned from upload).
- **Response**: Triggers AI analysis.

### Get Document Details
**GET** `/documents/:id`
- **Params**: `id` (Document ID).
- **Response**: Returns document details including summary and metadata.
