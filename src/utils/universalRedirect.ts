import { Response } from "express";

export function universalRedirect(res: Response, url: string) {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Redirecting...</title>
        <!-- HTML-level fallback -->
        <meta http-equiv="refresh" content="0;url=${url}" />
        <script>
          // JS fallback for browsers that block meta redirect
          window.location.replace("${url}");
        </script>
      </head>
      <body>
        <p>Redirecting to <a href="${url}">${url}</a>...</p>
      </body>
    </html>
  `);
}
