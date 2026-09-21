const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const baseUrl = 'https://white-floral-template.vercel.app';
const downloadedUrls = new Set();

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        if (downloadedUrls.has(url)) {
            console.log(`⊗ Skipped (already downloaded): ${url}`);
            return resolve();
        }

        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        console.log(`↓ Downloading: ${url}`);

        protocol.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    downloadedUrls.add(url);
                    console.log(`✓ Saved: ${filepath}`);
                    resolve();
                });
            } else {
                fs.unlink(filepath, () => {});
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

function extractUrls(html, baseUrl) {
    const urls = {
        css: [],
        js: [],
        images: [],
        fonts: [],
        audio: []
    };

    // Extract CSS links
    const cssRegex = /href="([^"]+\.css[^"]*)"/g;
    let match;
    while ((match = cssRegex.exec(html)) !== null) {
        const url = match[1].startsWith('http') ? match[1] : new URL(match[1], baseUrl).href;
        urls.css.push(url);
    }

    // Extract JS scripts
    const jsRegex = /src="([^"]+\.js[^"]*)"/g;
    while ((match = jsRegex.exec(html)) !== null) {
        const url = match[1].startsWith('http') ? match[1] : new URL(match[1], baseUrl).href;
        urls.js.push(url);
    }

    // Extract images (img src, srcSet, background images)
    const imgRegex = /(?:src|srcSet)="([^"]+\.(jpg|jpeg|png|webp|gif|svg)[^"]*)"/gi;
    while ((match = imgRegex.exec(html)) !== null) {
        const url = match[1].startsWith('http') ? match[1] : new URL(match[1], baseUrl).href;
        urls.images.push(url);
    }

    // Extract more images from srcSet
    const srcSetRegex = /https:\/\/[^\s]+?\.(jpg|jpeg|png|webp|gif)\?[^\s]+/gi;
    while ((match = srcSetRegex.exec(html)) !== null) {
        urls.images.push(match[0]);
    }

    // Extract fonts
    const fontRegex = /href="([^"]+\.(woff2|woff|ttf|eot)[^"]*)"/g;
    while ((match = fontRegex.exec(html)) !== null) {
        const url = match[1].startsWith('http') ? match[1] : new URL(match[1], baseUrl).href;
        urls.fonts.push(url);
    }

    // Extract audio
    const audioRegex = /src="([^"]+\.(mp3|ogg|wav)[^"]*)"/g;
    while ((match = audioRegex.exec(html)) !== null) {
        const url = match[1].startsWith('http') ? match[1] : new URL(match[1], baseUrl).href;
        urls.audio.push(url);
    }

    // Deduplicate
    urls.css = [...new Set(urls.css)];
    urls.js = [...new Set(urls.js)];
    urls.images = [...new Set(urls.images)];
    urls.fonts = [...new Set(urls.fonts)];
    urls.audio = [...new Set(urls.audio)];

    return urls;
}

function getLocalPath(url) {
    const parsedUrl = new URL(url);
    let pathname = parsedUrl.pathname;

    // Remove leading slash
    pathname = pathname.replace(/^\//, '');

    // Add query params to filename to avoid collisions
    if (parsedUrl.search) {
        const ext = path.extname(pathname);
        const basename = path.basename(pathname, ext);
        const dirname = path.dirname(pathname);
        const hash = Buffer.from(parsedUrl.search).toString('base64').replace(/[/+=]/g, '').substring(0, 8);
        pathname = path.join(dirname, `${basename}_${hash}${ext}`);
    }

    return pathname || 'index.html';
}

async function downloadSite() {
    console.log('=== Starting site download ===\n');

    // Download main HTML
    console.log('Step 1: Downloading main HTML...');
    const htmlPath = 'index.html';
    await downloadFile(baseUrl, htmlPath);

    const html = fs.readFileSync(htmlPath, 'utf-8');

    // Extract all URLs
    console.log('\nStep 2: Extracting resource URLs...');
    const urls = extractUrls(html, baseUrl);

    console.log(`\nFound resources:`);
    console.log(`  CSS files: ${urls.css.length}`);
    console.log(`  JS files: ${urls.js.length}`);
    console.log(`  Images: ${urls.images.length}`);
    console.log(`  Fonts: ${urls.fonts.length}`);
    console.log(`  Audio: ${urls.audio.length}`);

    // Download CSS files
    console.log('\n\nStep 3: Downloading CSS files...');
    for (const url of urls.css) {
        try {
            const localPath = getLocalPath(url);
            await downloadFile(url, localPath);
        } catch (err) {
            console.error(`✗ Failed: ${url} - ${err.message}`);
        }
    }

    // Download JS files
    console.log('\n\nStep 4: Downloading JS files...');
    for (const url of urls.js) {
        try {
            const localPath = getLocalPath(url);
            await downloadFile(url, localPath);
        } catch (err) {
            console.error(`✗ Failed: ${url} - ${err.message}`);
        }
    }

    // Download images
    console.log('\n\nStep 5: Downloading images...');
    for (const url of urls.images) {
        try {
            const localPath = getLocalPath(url);
            await downloadFile(url, localPath);
        } catch (err) {
            console.error(`✗ Failed: ${url} - ${err.message}`);
        }
    }

    // Download fonts
    console.log('\n\nStep 6: Downloading fonts...');
    for (const url of urls.fonts) {
        try {
            const localPath = getLocalPath(url);
            await downloadFile(url, localPath);
        } catch (err) {
            console.error(`✗ Failed: ${url} - ${err.message}`);
        }
    }

    // Download audio
    console.log('\n\nStep 7: Downloading audio...');
    for (const url of urls.audio) {
        try {
            const localPath = getLocalPath(url);
            await downloadFile(url, localPath);
        } catch (err) {
            console.error(`✗ Failed: ${url} - ${err.message}`);
        }
    }

    // Save resource map
    fs.writeFileSync('resource-map.json', JSON.stringify(urls, null, 2));
    console.log('\n✓ Resource map saved to resource-map.json');

    console.log('\n=== Download complete! ===');
    console.log(`Total files downloaded: ${downloadedUrls.size}`);
}

downloadSite().catch(console.error);
