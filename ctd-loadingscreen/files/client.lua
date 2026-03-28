-- CTD Loading Screen - Client Script

local IMAGE_EXTS = { png = true, jpg = true, jpeg = true, webp = true, gif = true }

-- Scans assets/background/* declared in the manifest and returns NUI-relative paths.
local function getBackgroundImages()
    local images = {}
    local resourceName = GetCurrentResourceName()
    local numFiles = GetNumResourceMetadata(resourceName, 'file')

    for i = 0, numFiles - 1 do
        local filePath = GetResourceMetadata(resourceName, 'file', i)
        if filePath and filePath:match('^assets/background/') then
            local ext = filePath:match('%.(%w+)$')
            if ext and IMAGE_EXTS[ext:lower()] then
                -- Resolve relative to NUI at files/web/
                table.insert(images, '../../' .. filePath)
            end
        end
    end

    return images
end

-- Send config to NUI via SendNUIMessage (works during loading screen;
-- postNui/fetch from NUI back to client does NOT work at this stage).
Citizen.CreateThread(function()
    Citizen.Wait(500) -- give the NUI frame time to initialize

    SendNUIMessage({
        type   = 'loadConfig',
        config = {
            title          = LOADINGSCREEN_CONFIG.title,
            subtitle       = LOADINGSCREEN_CONFIG.subtitle,
            displayMs      = LOADINGSCREEN_CONFIG.displayMs,
            transitionMs   = LOADINGSCREEN_CONFIG.transitionMs,
            musicVolume    = LOADINGSCREEN_CONFIG.musicVolume,
            images         = getBackgroundImages(),
            imagesFromServer = {},
            musicFromServer  = {},
        }
    })
end)

-- NUI requests shutdown when loading reaches 100% (fetch works at this stage)
RegisterNUICallback('shutdown', function(data, cb)
    ShutdownLoadingScreenNui()
    cb({})
end)
