export const LoadingPage = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Loading</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #f5f7fa;
          }
          .loading-container {
            text-align: center;
          }
          .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 3px solid #3498db;
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            margin-top: 15px;
            color: #7f8c8d;
            font-size: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </head>
      <body>
        <div class="loading-container">
          <div class="spinner"></div>
          <p class="loading-text">{message}</p>
        </div>
      </body>
    </html>
  )
}
