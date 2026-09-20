import re
import os

ROOT_FOOTER = """    <footer class="footer-section">
        <div class="footer-inner">
            <!-- Brand Block -->
            <div class="footer-column footer-brand">
                <a class="footer-logo" href="./" aria-label="Infotris home">
                    <img src="assets/logo.png" alt="Infotris logo" width="36" height="36">
                    <span>Infotris</span>
                </a>
                <p class="footer-tagline">Learn &bull; Build &bull; Grow</p>
                <p class="footer-mission">
                    Infotris doesn't create knowledge—it organizes the world's knowledge into structured trails so anyone can learn, build, and grow.
                </p>
            </div>

            <!-- Navigation Column -->
            <div class="footer-column">
                <h3 class="footer-heading">Navigation</h3>
                <ul class="footer-links">
                    <li><a href="./">Home</a></li>
                    <li><a href="about">About</a></li>
                    <li><a href="careers">Career Paths</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </div>

            <!-- Community Column -->
            <div class="footer-column">
                <h3 class="footer-heading">Community</h3>
                <ul class="footer-links">
                    <li><a href="https://www.instagram.com/infotrishq" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                    <li><a href="https://x.com/Infotrishq" target="_blank" rel="noopener noreferrer">X (Twitter)</a></li>
                    <li><a href="https://www.reddit.com/user/Infotris/" target="_blank" rel="noopener noreferrer">Reddit</a></li>
                    <li><a href="https://www.youtube.com/@Infotrishq" target="_blank" rel="noopener noreferrer">YouTube</a></li>
                </ul>
            </div>

            <!-- Contact Column -->
            <div class="footer-column">
                <h3 class="footer-heading">Contact</h3>
                <ul class="footer-links">
                    <li><a href="mailto:hello.infotris@gmail.com" target="_blank" rel="noopener noreferrer">Email</a></li>
                    <li class="footer-social-row">
                        <a href="https://www.instagram.com/infotrishq" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="footer-social-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href="https://x.com/Infotrishq" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" class="footer-social-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="svg-icon"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                        </a>
                        <a href="https://www.reddit.com/user/Infotris/" target="_blank" rel="noopener noreferrer" aria-label="Reddit" class="footer-social-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="svg-icon"><path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.32-4.17 3.61.77c.01.94.78 1.7 1.73 1.7 1.05 0 1.9-.85 1.9-1.9s-.85-1.9-1.9-1.9c-.83 0-1.53.55-1.79 1.3l-3.99-.85c-.09-.02-.18.02-.24.08-.06.06-.09.15-.07.24l-1.48 4.67c-2.49.04-4.75.68-6.42 1.7-.56-.75-1.46-1.22-2.4-1.22-1.65 0-3 1.35-3 3 0 1.11.61 2.08 1.51 2.59-.05.29-.08.59-.08.9 0 3.86 4.7 7 10.5 7s10.5-3.14 10.5-7c0-.31-.03-.61-.08-.9.9-.51 1.51-1.48 1.51-2.59zm-16.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm11.23 3.4c-1.11 1.11-3.21 1.2-3.73 1.2s-2.62-.09-3.73-1.2c-.1-.1-.1-.26 0-.36.1-.1.26-.1.36 0 .91.91 2.76 1.01 3.37 1.01s2.46-.1 3.37-1.01c.1-.1.26-.1.36 0 .1.1.1.26 0 .36zm-.73-3.4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                        </a>
                        <a href="https://www.youtube.com/@Infotrishq" target="_blank" rel="noopener noreferrer" aria-label="YouTube" class="footer-social-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="svg-icon"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        </a>
                        <a href="mailto:hello.infotris@gmail.com" target="_blank" rel="noopener noreferrer" aria-label="Email" class="footer-social-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; 2026 Infotris. All rights reserved.</p>
        </div>
    </footer>"""

SUBDIR_FOOTER = ROOT_FOOTER.replace('assets/logo.png', '../../assets/logo.png') \
                           .replace('href="./"', 'href="../../"') \
                           .replace('href="about"', 'href="../../about"') \
                           .replace('href="careers"', 'href="../../careers"')

FILES_TO_UPGRADE = {
    "index.html": ROOT_FOOTER,
    "about.html": ROOT_FOOTER,
    "careers.html": ROOT_FOOTER,
    "courses.html": ROOT_FOOTER,
    "signup.html": ROOT_FOOTER,
    "student-dashboard.html": ROOT_FOOTER,
    "trisgraph.html": ROOT_FOOTER,
    "careers/python-developer/index.html": SUBDIR_FOOTER,
    "courses/python/index.html": SUBDIR_FOOTER
}

def upgrade_file(filepath, new_footer):
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    pattern = re.compile(r'<footer class="footer-section">[\s\S]*?</footer>')
    
    if not pattern.search(content):
        print(f"Warning: Footer pattern not found in {filepath}")
        return
        
    updated_content = pattern.sub(new_footer, content)
    
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        f.write(updated_content)
    print(f"Successfully upgraded footer in {filepath}")

if __name__ == "__main__":
    # Base directory
    base_dir = r"c:\Users\surya\OneDrive\Desktop\OpenLearn\OpenLearn"
    
    for filename, footer in FILES_TO_UPGRADE.items():
        fullpath = os.path.join(base_dir, filename.replace('/', os.sep))
        upgrade_file(fullpath, footer)
