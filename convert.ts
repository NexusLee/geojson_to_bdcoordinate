
  import * as fs from 'fs';
  import * as request from 'request';
  import * as async from 'async';

  const path = './';
  const input = path + 'town.json';
  const output = path + 'town.json';
  const perChunk = 100;

  let result: any = JSON.parse((fs.readFileSync(input)).toString());
  let features: any = result.features;

  var q = async.queue(function(task: any, callback) {
      callback && callback(task.url);
  }, 1);

  features.map((item: any, index: number) => {
      let coordinates: any = item.geometry.coordinates;
      let coords: any = item.geometry.coords;
      let arr: any = [];

      if(coords !== undefined && coords !== "") {
          return;
      }

      coordinates.map((item1: any, index1: number) => {
          if(item.geometry.type === "MultiPolygon") {
              item1.map((item2: any, index2: number) => {
                  let reduceArr = item2.reduce((resultArray: string[], item: any, index: number) => {
                      const chunkIndex = Math.floor(index / perChunk);

                      if(!resultArray[chunkIndex]) {
                          resultArray[chunkIndex] = '';
                      }

                      resultArray[chunkIndex] += item + ";";

                      return resultArray;
                  }, []);

                  reduceArr.map((coords: any, index3: number) => {
                      let reg = /;$/gi;
                      coords = coords.replace(reg,"");
                      let url = 'http://api.map.baidu.com/geoconv/v1/?coords=' + coords + '&from=1&to=5&ak=your_baidu_map_key';

                      q.push({ url: url }, function(data: any){
                          fetchUrl(url, function(data: any, error: any){
                              if(error !== null) {
                                  console.log(error);
                                  return;
                              }
                              let totalString = '';


                              if(data && data.result) {
                                  data.result.map((el: any) => {
                                      totalString += el.x + ',' + el.y + ';'
                                  });
                              }

                              arr[index3] = (totalString);

                              if(index3 === reduceArr.length -1){
                                  coordinates = [];

                                  var isContainEmptyString = arr.some(function(value: string){
                                      return value === ''
                                  });

                                  if(isContainEmptyString){
                                      return;
                                  }

                                  var convertCoords = arr.reduce(function (prev: any, cur: any) {
                                      return prev + cur;
                                  }, []);
                                  coordinates.push(convertCoords);


                                  if(item.geometry.coords instanceof Array){
                                      item.geometry.coords = [...item.geometry.coords, ...coordinates];
                                  }else{
                                      item.geometry.coords = coordinates;
                                  }

                                  console.log(item.geometry.coords)
                              }
                              //remove if run not the first time
                              if(index === features.length -1 && index2 === item1.length -1 && index3 === reduceArr.length -1){
                                  fs.writeFileSync(output, JSON.stringify(result));
                              }
                          })
                      });
                  });
              });
          }

          if(item.geometry.type === "Polygon") {
              let reduceArr = item1.reduce((resultArray: string[], item: any, index: number) => {
                  const chunkIndex = Math.floor(index / perChunk);

                  if(!resultArray[chunkIndex]) {
                      resultArray[chunkIndex] = '';
                  }

                  resultArray[chunkIndex] += item + ";";

                  return resultArray;
              }, []);

              reduceArr.map((coords: any, index2: number) => {
                  let reg = /;$/gi;
                  coords = coords.replace(reg,"");
                  let url = 'http://api.map.baidu.com/geoconv/v1/?coords=' + coords + '&from=1&to=5&ak=your_baidu_map_key';

                  q.push({ url: url }, function(data: any){
                      fetchUrl(url, function(data: any, error: any){
                          if(error !== null) {
                              console.log(error);
                              return;
                          }
                          let totalString = '';

                          if(data && data.result) {
                              data.result.map((el: any) => {
                                  totalString += el.x + ',' + el.y + ';'
                              });
                          }

                          arr[index2] = (totalString);

                          if(index2 === reduceArr.length -1){
                              coordinates = [];

                              var isContainEmptyString = arr.some(function(value: string){
                                  return value === ''
                              });

                              if(isContainEmptyString){
                                  return;
                              }

                              var convertCoords = arr.reduce(function (prev: any, cur: any) {
                                  return prev + cur;
                              }, []);
                              coordinates.push(convertCoords);

                              if(item.geometry.coords instanceof Array){
                                  item.geometry.coords = [...item.geometry.coords, coordinates];
                              }else{
                                  item.geometry.coords = coordinates;
                              }
                          }
                          //remove if run not the first time
                          if(index === features.length -1 && index2 === reduceArr.length -1){
                              fs.writeFileSync(output, JSON.stringify(result));
                          }
                      })
                  });
              });
          }
      });
  });

  let count = 0;
  function fetchUrl(url: any, callback: any){
      count++;
      console.log(count);
      request(url, function(error: any, response: any, body: any) {
          if(error) {
              console.log(error);
              console.log(JSON.parse(body));
              callback && callback(null, error);
          }
          if (!error && response.statusCode == 200) {
              let data = JSON.parse(body);
              callback && callback(data, null);
          }
      })
   }
