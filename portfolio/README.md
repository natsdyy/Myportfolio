# Vue Portfolio Website

A modern, responsive portfolio website built with Vue 3 and Vite. This project showcases your work, skills, and provides a way for potential clients or employers to get in touch.

## Features

✨ **Key Features:**
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Single Page Application** - Smooth navigation between sections without page reloads
- **Modern UI** - Clean and professional design with smooth animations
- **Multiple Sections:**
  - Hero section with social links
  - About me with highlights
  - Project showcase with filtering
  - Skills display with proficiency levels
  - Contact form
  - Footer with links

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend build tool
- **CSS3** - Modern styling with custom properties
- **Font Awesome** - Icon library

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Development

### Project Structure

```
src/
├── components/
│   ├── Navigation.vue    # Navigation bar with mobile menu
│   ├── Hero.vue          # Hero section with intro
│   ├── About.vue         # About me section
│   ├── Projects.vue      # Projects showcase
│   ├── Skills.vue        # Skills and proficiency
│   ├── Contact.vue       # Contact form
│   └── Footer.vue        # Footer with links
├── App.vue               # Main app component
├── main.js               # Entry point
└── style.css             # Global styles
```

### Available Commands

- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally

## Customization

### Update Personal Information

Edit the following components to add your information:

1. **Hero Section** (`src/components/Hero.vue`):
   - Update `name`, `title`, and `description`
   - Add social media links

2. **About Section** (`src/components/About.vue`):
   - Update the about text
   - Modify highlights

3. **Projects Section** (`src/components/Projects.vue`):
   - Add your projects to the `projects` array
   - Update project images, descriptions, and links

4. **Skills Section** (`src/components/Skills.vue`):
   - Add your skills in `skillCategories`
   - Update proficiency levels in `proficiency` array

5. **Contact Section** (`src/components/Contact.vue`):
   - Update contact information
   - Connect the form to your backend

### Customize Colors

The portfolio uses CSS custom properties for theming. Edit the colors in `src/App.vue`:

```css
:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --accent-color: #e74c3c;
  --text-color: #333;
  --light-bg: #ecf0f1;
  --white: #ffffff;
}
```

## Building for Production

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **The optimized files will be in the `dist` folder**

3. **Deploy to your hosting service** (Vercel, Netlify, GitHub Pages, etc.)

### Deployment Options

- **Vercel** - Recommended for Vite projects
- **Netlify** - Drag and drop your `dist` folder
- **GitHub Pages** - Use GitHub Actions
- **Traditional Hosting** - Upload `dist` folder via FTP

## Features to Add

Consider adding these features to enhance your portfolio:

- [ ] Dark mode toggle
- [ ] Animated scrolling transitions
- [ ] Project filtering/search
- [ ] Blog section
- [ ] Testimonials section
- [ ] Download CV button
- [ ] Multi-language support
- [ ] Email notification backend integration

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized for Core Web Vitals
- Fast initial load time
- Smooth animations with CSS
- Minimal JavaScript dependencies

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please create an issue in the repository.

## Next Steps

1. Replace placeholder images with your actual project images
2. Update all text with your personal information
3. Add your actual project links
4. Customize the color scheme to match your brand
5. Test on various devices and browsers
6. Deploy to your chosen hosting platform

---

**Happy building! 🚀**
