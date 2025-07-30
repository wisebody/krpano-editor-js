const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const xml2js = require('xml2js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var parser = new xml2js.Parser();
var builder = new xml2js.Builder();
app.post('/server/save', function (req, res) {
  //XML 파일을 읽기
  fs.readFile('./static/krpano.xml', 'utf8', function (err, data) {
    if (err) throw err;
    //XML을 객체로 변환
    parser.parseString(data, function (parseErr, obj) {
      if (parseErr) throw parseErr;
      //요청 매개변수에 따라 DOM 노드를 수정합니다.
      var scenes = req.body;
      scenes.forEach(function (scene) {
        var sceneObj = obj.krpano.scene[scene.index];
        //초기 관찰 지점
        var viewAttr = sceneObj.view[0].$;
        if (scene.initH) viewAttr.hlookat = scene.initH;
        if (scene.initV) viewAttr.vlookat = scene.initV;
        if (scene.fov) viewAttr.fov = scene.fov;
        if (scene.fovmax) viewAttr.fovmax = scene.fovmax;
        if (scene.fovmin) viewAttr.fovmin = scene.fovmin;
        delete viewAttr.maxpixelzoom;
        //장면 이름
        sceneObj.$.name = scene.name;
        //핫스팟
        if (scene.hotSpots) {
          sceneObj.hotspot = [];
          scene.hotSpots.forEach(function (hotSpot) {
            sceneObj.hotspot.push({
              $: {
                ath: hotSpot.ath,
                atv: hotSpot.atv,
                linkedscene: hotSpot.linkedscene,
                name: hotSpot.name,
                style: hotSpot.style,
                dive: hotSpot.dive,
              },
            });
          });
        }
        //자동 회전
        if (scene.autorotate) {
          sceneObj.autorotate = [
            {
              $: {
                enabled: scene.autorotate.enabled,
                waittime: scene.autorotate.waitTime,
                accel: '1.0',
                speed: '5.0',
                horizon: '0.0',
              },
            },
          ];
        }
        //초기화면
        if (scene.welcomeFlag) {
          obj.krpano.action[0]._ =
            'if(startscene === null OR !scene[get(startscene)], copy(startscene,scene[' +
            scene.index +
            "].name); );loadscene(get(startscene), null, MERGE);if(startactions !== null, startactions() );js('onready');";
        }
      });
      //객체를 XML로 변환합니다.
      var xmlStr = builder.buildObject(obj);
      //파일 쓰기
      fs.writeFile('./static/krpano.xml', xmlStr, 'utf8', function (err) {
        if (err) throw err;
        res.send('저장 완료');
      });
    });
  });
});

app.use('/', express.static(__dirname + '/static'));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
