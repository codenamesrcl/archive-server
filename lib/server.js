/**
 * Borrowed from the epubServer code
 * this will be a lot simpler as it's purely an asset server, there won't be a
 * processing layer needed like it is with the epub server
 * so a lot of this server code may be trimmed out
 */

var http = require('http'),
    urlUtil = require('url'),
    lib7z = require('7z-wrapper'),
    mimetypes = require('mime-types'),
    path = require('path');

var server = null,
    requestTicker = 0,
    serverport = 0;

/**
 * Creates and starts a http server to act as the epub server
 * @param  {int} port     A value for the server port
 */
function startServer(port){
    var promise = new Promise(function(resolve,reject){
        if(server == null){
            server = http.createServer(requestHandler)
            server.listen(port, function(){
                console.log("now listening on " + port);
                serverport = port;
                //resolve(objFactory.ServerInfo(port, epubmanifest));
                resolve(serverport);
            });
        }
        else{
            resolve(serverport);
        }
    });

    return promise;
}

function stopServer(){
    if(server != null){
        server.stop();
    }
}

function requestHandler(request, response){
    if(request.method === 'GET'){
        var urlSpec = urlUtil.parse(request.url, true);

        if(urlSpec.pathname === '/test'){
            test(response);
        }
        else if(urlSpec.pathname === '/favicon.ico'){
            response.statusCode = 200;
            response.end('');
        }
        else if(urlSpec.pathname === '/get'){
            assetResponse(urlSpec, response);
        }
    }
    else{
        response.write('Invalid verb, this server only accepts GET requests');
        response.end();
    }
}

function test(response){
    lib7z.extract.file.toMemory({
        archpath: path.resolve('./test/test.7z'),
        filepath: 'test.jpg',
        reqname: 'asset' + '00',
    })
    .then(
        function(assetResult){
            try{
                //console.log(mimetypes.lookup(route));
                response.statusCode = 200;
                //response.setHeader('Content-Length', assetResult.files[0].buffer.length);
                response.setHeader('Content-Type', mimetypes.lookup('test.jpg'));

                //console.log("writing buffer");
                response.end(assetResult.data);
            }
            catch(err){
                console.log(err);
                response.statusCode = 500;
                response.end("Error serving the test");
            }
        },
        function(err){
            console.error(err);
            response.statusCode = 500;
            response.end("Error extracting from test archive");
        });
}

function assetResponse(urlSpec, response){
    requestTicker++;

    // console.log(manifest.contentBasePath);
    // console.log(contentUrl);
    lib7z.extract.file.toMemory({
        archpath: urlSpec.query.archive,
        filepath: urlSpec.query.file,
        reqname: 'asset' + requestTicker,
        //verbose:true
    })
    .then(
        function(assetResult){
            try{
                //console.log(mimetypes.lookup(route));
                response.statusCode = 200;
                //response.setHeader('Content-Length', assetResult.files[0].buffer.length);
                response.setHeader('Content-Type', mimetypes.lookup(urlSpec.query.file));

                //console.log("writing buffer");
                response.end(assetResult.data);
            }
            catch(err){
                console.log(err);
                response.statusCode = 500;
                response.end("Error serving the asset");
            }
        },
        function(err){
            console.error(err);
            response.statusCode = 500;
            response.end("Error extracting from archive");
        });
}


module.exports = {
    startServer: startServer,
    stopServer: stopServer
}
