const handler = require('serve-handler');
const http = require('http');
var xml = require('xml');
const sqlite3 = require('sqlite3').verbose();
const gl_db = new sqlite3.Database('pandus.db');
var parseString = require('xml2js').parseString;
var fs = require('fs');
 
var options = {
    key: fs.readFileSync('key.key'),
    cert: fs.readFileSync('cert.crt'),
    requestCert: false,
    rejectUnauthorized: false
};
 
const server = http.createServer(options, (request, response) => {
	
	if(request.url.split('?')[0]==='/points'){
		if(getattr(request.url,'cmd')==='get'){
			latLngList = [
											getattr(request.url,'minlat'),
											getattr(request.url,'minlng'),
											getattr(request.url,'maxlat'),
											getattr(request.url,'maxlng'),
									 ];
			const db = gl_db;
			//console.log('SELECT * FROM points WHERE lat >= '+latLngList[0]+' AND lng >= '+latLngList[1]+' AND lat <= '+latLngList[2]+' AND lng <= '+latLngList[3]);
			let dat = '<main>';
			db.each('SELECT * FROM points WHERE lat >= '+latLngList[0]+' AND lng >= '+latLngList[1]+' AND lat <= '+latLngList[2]+' AND lng <= '+latLngList[3], function(err,row){
				dat+=xml({
					point: [{
						_attr: {
							lat: row.lat,
							lng: row.lng,
							desc: row.desc,
							status: row.status,
							comm: row.comm,
							id: row.id
						}
					}]
				});
			},function complete(err, num){
				dat+='</main>';
				response.end(dat);
			});
		}else if(getattr(request.url,'cmd')==='set'){
				request.on('data', chunk => {
							parseString(chunk.toString(), function (err, result) {

									if(result.xml===''){
										response.end('');
										return;
									}
									for(var i =0;i<result.xml.point.length;i++){
										tdata = [result.xml.point[i].lat[0],
																result.xml.point[i].lng[0],
																result.xml.point[i].desc[0],
																result.xml.point[i].status[0],
																result.xml.point[i].comm[0],
																result.xml.point[i].id[0]];
										const db = gl_db;
										if(tdata[5]=='-1'){
											db.run("INSERT INTO points VALUES("+tdata[0]+','+tdata[1]+',\''+tdata[2]+'\','+tdata[3]+',\''+tdata[4]+'\', (SELECT MAX(id)+1 FROM points))');
										}else{
											db.serialize(function() {
												db.exec('DELETE FROM points WHERE id='+tdata[5]);
												db.run("INSERT INTO points VALUES("+tdata[0]+','+tdata[1]+',\''+tdata[2]+'\','+tdata[3]+',\''+tdata[4]+'\','+tdata[5]+')');
											});
										}
									}
									response.end('');
							});
				});
			const db = gl_db;
			db.run('DELETE FROM points WHERE lat>=90');
		}else{
				response.end('');
		}
	}else{
  	return handler(request, response);
  }
})
 
server.listen(8080, () => {
  console.log('Running at http://localhost:8080');
});

function getattr(url,key){
	var tmp = url.split(key+'=')[1];
	if(tmp!=undefined){
		return tmp.split('&')[0];
	}else{
		return '';
	}
}
