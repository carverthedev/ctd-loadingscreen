# CTD Loading Screen

A customizable FiveM loading screen with background slideshow, music playback, and persistent mute preferences.

## Features

- **Custom Server Title** - Display your server name instead of "Connecting..."
- **Background Slideshow** - Automatically loads images from the assets folder
- **Music Playback** - Supports multiple MP3 files with auto-advance
- **Mute Button** - Players can toggle music on/off (preference saved in browser)
- **Fully Customizable** - Easy configuration through config.lua
- **Clean UI** - Modern design with progress bar and status updates

## Installation

1. Download and place `ctd-loadingscreen` in your resources folder
2. Add `ensure ctd-loadingscreen` to your `server.cfg`
3. Restart your server

## Configuration

Edit `config.lua` to customize your loading screen:

```lua
LOADINGSCREEN_CONFIG = {
    mode = "single",              -- "single" or "slideshow"
    
    -- Text displayed on loading screen
    title = "Your Server Name",   -- Main title (replaces "Connecting...")
    subtitle = "Welcome message",  -- Subtitle text
    
    displayMs = 6000,             -- How long each slide displays (ms)
    transitionMs = 1200,          -- Fade transition duration (ms)
    
    musicVolume = 0.08,           -- Default volume (0.0 to 1.0)
}
```

## Adding Media

### Background Images
- Place your images in the `assets/` folder
- Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`
- Images are loaded alphabetically
- Files named `logo.*` are reserved for the logo and won't appear as backgrounds

### Music
- Place MP3 files in the `assets/` folder
- The script automatically loads all `.mp3` files
- Multiple songs will auto-advance when each finishes
- Players can mute/unmute using the button on the right side

### Logo
- Place your logo at `assets/logo.png`
- This appears at the top center of the loading screen

## Features Explained

### Mute Button
- Located on the middle-right edge of the screen
- Click to toggle music on/off
- Preference is saved in browser cache (persists between sessions)
- Shows speaker icon when playing, muted icon when silent

### Slideshow Mode
- Set `mode = "slideshow"` in config.lua
- Automatically cycles through images in the assets folder
- Smooth fade transitions between images

### Single Mode
- Set `mode = "single"` in config.lua
- Shows one background image or defaults to a scenic fallback

## File Structure

```
ctd-loadingscreen/
├── fxmanifest.lua          # Resource manifest
├── config.lua              # User configuration
├── README.md               # This file
├── assets/                 # Your media files
│   ├── logo.png           # Server logo (required)
│   ├── music.mp3          # Music files (optional)
│   └── image1.jpg         # Background images (optional)
└── files/
    ├── client.lua         # Client-side script
    ├── server.lua         # Server-side script (scans assets folder)
    └── web/
        ├── index.html     # Loading screen HTML
        ├── style.css      # Styling
        └── script.js      # Frontend logic
```

## Technical Details

- Uses FiveM's native loading screen API
- No database required - mute preference stored in browser localStorage
- Music and images are automatically scanned from the assets folder
- Manual shutdown enabled for smooth transition to game

## Troubleshooting

**No music playing:**
- Ensure you have `.mp3` files in the `assets/` folder
- Check browser console (F12) for any errors
- Try clicking anywhere on the screen (some browsers block autoplay)

**Images not showing:**
- Make sure images are in the `assets/` folder
- Check file extensions are supported (png, jpg, jpeg, webp)
- Verify files aren't named `logo.*`

**Title not updating:**
- Edit the `title` field in `config.lua`
- Restart the resource
- Clear browser cache if needed

## Support

For issues or feature requests, please contact the developer.

## Credits

Created by Carver Tech Development
