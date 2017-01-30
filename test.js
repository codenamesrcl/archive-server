var archiveServer = require('./');

archiveServer.startServer(17312)
    .then(function(){
        console.log('server started');
        startTest();
    });
