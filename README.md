<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Virtual Dressing Room - AI Try-On Studio

Welcome to the Virtual Dressing Room, a powerful and versatile creative suite powered by the Google Gemini API. This application serves as an all-in-one studio for virtual try-ons, scene creation, hairstyle experimentation, and marketing image generation. It's designed for fashion brands, designers, marketers, and creators who want to visualize ideas and produce high-quality imagery without the need for physical photoshoots.

View your app in AI Studio: https://ai.studio/apps/drive/1MbcfwOVIoNPAaMnj8N2tJIrFYzTasxsK

## ✨ Key Features

- **👗 Virtual Try-On:** Dress a model in any clothing by describing it with text or uploading an image. Choose between locking the model's original pose and background or generating a completely new creative scene.
- **🖼️ Scene Swap:** Seamlessly place your model into an entirely new environment. Upload a target scene, and the AI will composite your model into it, matching the pose, lighting, and style.
- **💇‍♀️ Hairstyle Try-On:** Experiment with new looks by applying hairstyles from a reference image onto your model.
- **📣 Marketing Generator:** Create professional product shots and conceptual marketing images from text prompts, with or without a base product image.
- **🎬 Image-to-Video Animation:** Bring your generated images to life! Describe a motion, and the VEO model will create a short video animation from your static image.
- **🎨 Advanced Studio Editor:** A full suite of tools to perfect your creations:
    - **Inpainting:** Edit specific parts of an image with a brush and a text prompt.
    - **Generative Edits:** Make creative changes, add accessories, or stage products in the scene.
    - **Adjustments:** Fine-tune brightness, contrast, and add cinematic film grain.
    - **Overlays:** Add speech bubbles and a custom watermark.
- **🤖 Powered by Gemini:** Utilizes multiple state-of-the-art models including `gemini-2.5-flash-image` (for editing), `imagen-4.0-generate-001` (for text-to-image), and `veo-2.0-generate-001` (for video).
- **🌓 Light & Dark Mode:** A stylish and responsive neobrutalist UI that looks great in any theme.

## 🚀 Use Cases

This application is perfect for a wide range of creative and commercial needs:

-   **E-commerce & Fashion Brands:** Visualize new apparel designs on models in various settings, generating lifestyle shots and product images at a fraction of the cost of traditional photoshoots.
-   **Designers & Stylists:** Quickly prototype new looks, create mood boards, and experiment with different clothing, accessory, and hairstyle combinations.
-   **Social Media Influencers:** Create unique and engaging content by virtually trying on outfits, changing hairstyles, or placing themselves in exotic locations.
-   **Marketers & Advertisers:** Generate bespoke, high-quality imagery for digital ads, social media campaigns, and website banners without relying on stock photos.
-   **Hairstylists & Salons:** Provide clients with a realistic preview of how a new hairstyle from a reference photo would look on them.

## 🛠️ Getting Started

You can run this application in two ways: within the AI Studio environment or locally on your own machine.

---

### Option 1: Run in AI Studio (Recommended)

This is the easiest way to get started. The application runs in a hosted environment, and you do not need to configure your own API key.

1.  **Open the App:** Click the link below to open the project directly in AI Studio.
    > https://ai.studio/apps/drive/1MbcfwOVIoNPAaMnj8N2tJIrFYzTasxsK
2.  **Run:** Click the "Run" button within AI Studio to start the application.

---

### Option 2: Run Locally (Requires a Gemini API Key)

This method is for developers who want to run the application on their local machine. You will need a Google Gemini API key.

**Prerequisites:**
-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   A [Google Gemini API key](https://ai.google.dev/). Please note that API usage may incur costs.

**Setup Steps:**

1.  **Clone or Download:** Get the code for this project.
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set API Key:**
    -   Create a new file named `.env` in the root of the project directory.
    -   Add your Gemini API key to this file:
    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

4.  **Run the App:**
    ```bash
    npm run dev
    ```
    This will start the local development server, and you can access the application in your browser at the provided URL (usually `http://localhost:5173`).

## ⚙️ Technology Stack

-   **Frontend:** React, TypeScript, Vite
-   **Styling:** Tailwind CSS, Custom CSS with a neobrutalist theme
-   **AI Models:**
    -   Google Gemini (`gemini-2.5-flash-image`, `gemini-2.5-flash`, `imagen-4.0-generate-001`, `veo-2.0-generate-001`)
-   **Face Detection:** MediaPipe Face Landmarker (for the optional "Restore Face" feature)

## 📄 License

This project is licensed under the Apache 2.0 License. See the `LICENSE` file for details.
