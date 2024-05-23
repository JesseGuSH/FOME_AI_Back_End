# My Backend Project

This is a backend of FOME.ai Prototype built with Node.js and Express. 
It serves as a local server for handling video uploading and processing for CV module requests and responses.

## Table of Contents

- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Installation

To run this project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/JesseGuSH/FOME_AI_Back_End.git
   ```

2. Install dependencies:

   ### `npm install`

3. In the project directory, you can run:

   ### `nodemon`

4. Repalce the download directory to yours in index.js:

   ### `/users/jesse/Desktop/FOME_Demo_Result/`

This will run locally at http://localhost:3000.

## GET /api/CVProcessing

- Description: This endpoint is used for CV (Computer Vision) processing.
- Method: POST
- URL: `http://${Your IP Address}:3000/api/CVProcessing`
- Response: CV Module Results.

## License

This project is licensed under the BSD-3-Clause License. See the [LICENSE](LICENSE) file for details.
