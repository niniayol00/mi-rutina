import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Plantilla HTML de la exportación web estática.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>Mi Rutina</title>
        <meta name="description" content="Tu libreta digital de entrenamiento" />
        <meta name="theme-color" content="#0B0B0B" />
        <link rel="manifest" href="/mi-rutina/manifest.json" />
        <link rel="apple-touch-icon" href="/mi-rutina/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mi Rutina" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'body{background:#0B0B0B}' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
