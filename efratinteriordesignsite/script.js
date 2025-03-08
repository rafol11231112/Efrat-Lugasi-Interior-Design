const styleData = {
    modern: {
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d",
        title: "Modern Style",
        description: "Clean lines, simple color palettes, and a focus on function and form. Modern design embraces minimalism while incorporating technological innovations.",
        colors: ["#000000", "#D3D3D3", "#87CEEB", "#FFD700"]
    },
    scandinavian: {
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f",
        title: "Scandinavian Style",
        description: "Light, airy spaces with natural materials and minimal decoration. Emphasizes functionality and connection to nature.",
        colors: ["#FFFFFF", "#F5F5F5", "#D3D3D3", "#8B4513"]
    },
    industrial: {
        image: "https://images.unsplash.com/photo-1505409859467-3a796fd5798e",
        title: "Industrial Style",
        description: "Raw materials, exposed elements, and an urban edge. Features metal, wood, and brick with an emphasis on utility.",
        colors: ["#696969", "#8B4513", "#000000", "#A9A9A9"]
    },
    minimalist: {
        image: "https://images.unsplash.com/photo-1449844908441-8829872d2607",
        title: "Minimalist Style",
        description: "Less is more. Simple color schemes, clean lines, and clutter-free spaces define this style.",
        colors: ["#FFFFFF", "#000000", "#D3D3D3", "#F5F5F5"]
    },
    bohemian: {
        image: "https://images.unsplash.com/photo-1522444195799-478538b28823",
        title: "Bohemian Style",
        description: "Eclectic and free-spirited, mixing patterns, textures, and colors. Emphasizes artistic expression and comfort.",
        colors: ["#FF4500", "#9370DB", "#FFD700", "#20B2AA"]
    },
    mediterranean: {
        image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea",
        title: "Mediterranean Style",
        description: "Warm and inviting with terracotta colors, natural textures, and ornate details inspired by coastal European living.",
        colors: ["#CD853F", "#DEB887", "#4682B4", "#8B4513"]
    },
    traditional: {
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6",
        title: "Traditional Style",
        description: "Classic and timeless with rich colors, elegant furnishings, and symmetrical arrangements.",
        colors: ["#8B4513", "#DAA520", "#800000", "#4B0082"]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const styleButtons = document.querySelectorAll('.style-btn');
    const styleImages = document.querySelectorAll('.style-image');

    styleButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and images
            styleButtons.forEach(btn => btn.classList.remove('active'));
            styleImages.forEach(img => img.classList.remove('active'));
            
            // Add active class to clicked button and corresponding image
            button.classList.add('active');
            const style = button.getAttribute('data-style');
            document.getElementById(style).classList.add('active');
            
            // Get the style data
            const data = styleData[style];
            
            // Update the content
            document.getElementById('style-image').src = data.image;
            document.getElementById('style-title').textContent = data.title;
            document.getElementById('style-description').textContent = data.description;
            
            // Update color palette
            const colorPalette = document.getElementById('style-colors');
            colorPalette.innerHTML = data.colors.map(color => 
                `<div class="color-dot" style="background-color: ${color}"></div>`
            ).join('');
        });
    });
}); 