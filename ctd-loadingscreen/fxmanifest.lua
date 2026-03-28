fx_version 'cerulean'
game 'gta5'

loadscreen 'files/web/index.html'
loadscreen_cursor 'yes'
loadscreen_manual_shutdown 'yes'

files {
    'files/web/index.html',
    'files/web/style.css',
    'files/web/script.js',
    'assets/*',
    'assets/background/*'
}

shared_script 'config.lua'
server_script 'files/server.lua'
client_script 'files/client.lua'

escrow_ignore {
    'config.lua',
    'assets/*',
    'assets/background/*'
}

dependency '/assetpacks'