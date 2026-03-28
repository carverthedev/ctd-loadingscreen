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
                table.insert(images, '../../' .. filePath)
            end
        end
    end

    return images
end

-- Send background images to NUI. Display config (title, subtitle, etc.) is
-- fetched directly from config.json by the NUI — no timing dependency.
-- We still retry a few times in case the NUI frame isn't ready yet.
Citizen.CreateThread(function()
    local images = getBackgroundImages()
    if #images == 0 then return end -- NUI will use the default fallback image

    local delays = { 500, 1500, 3000 }
    for _, delay in ipairs(delays) do
        Citizen.Wait(delay)
        SendNUIMessage({ type = 'loadImages', images = images })
    end
end)

-- NUI requests shutdown when loading reaches 100% (fetch works at this stage)
RegisterNUICallback('shutdown', function(data, cb)
    ShutdownLoadingScreenNui()
    cb({})
end)
