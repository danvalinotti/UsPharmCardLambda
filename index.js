var request = require("/opt/node_modules/request");
var rp = require('/opt/node_modules/request-promise');
const {Pool, Client} = require('/opt/node_modules/pg');
var db_host = process.env.DB_HOST;
var reg = process.env.REGION;

// const connectionString = 'postgresql://postgres:secret@10.80.1.121:5432/apid'
const connectionString = db_host;
                      
function DateFunction(){
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;
    return dateTime;
}
var DrugId=""
const client=new Client({
    connectionString:connectionString
})
client.connect()
var listDrugs = [];
let pricingData1 = {
    //id : "",
    average_price : 0,
    createdat : DateFunction(),
    difference : 0,
    drug_details_id : 0,
    lowest_market_price : 0,
    pharmacy : "",
    price : 0,
    program_id : 1,
    recommended_price : 0,
}

//let results =""
let url = ""
let data = []
var len=0;
exports.myhandler = async function abc(){
    var res1 = await client.query("SELECT drug_id FROM shuffle_drugs where flag = 'pending' and region = '"+reg+"'");
    for(var i=0; i< res1.rows.length ; i++){
        for(var j=0; j < res1.rows[i].drug_id.length; j++){
            //console.log("print ((((((((((((((((((("+res1.rows[i].drug_id[j]);
            listDrugs.push(res1.rows[i].drug_id[j]);
            //console.log("listdrugs:"+listDrugs)
        }
    }
    len = listDrugs.length;
    console.log(listDrugs)
   // const a = len;
    for(let k=0; k < len; k++){
        //console.log("listdrugs2:"+k)
        //if(k<=len){
        var drugUrlList = await client.query("SELECT * FROM drug_request where program_id = 1 and zipcode is not null and ndc is not null and quantity is not null and brand_indicator is not null and drug_id :: int ="+listDrugs[k]);
        if(drugUrlList.rows != 0){
        url = "https://api.uspharmacycard.com/drug/price/147/none/"+drugUrlList.rows[0].zipcode+"/"+drugUrlList.rows[0].ndc+"/"+encodeURIComponent(drugUrlList.rows[0].drug_name)+"/"+drugUrlList.rows[0].brand_indicator+"/"+drugUrlList.rows[0].quantity+"/8"

        await rp(url)
            .then(async function (response) {
                //console.log(url)
                let jsondata = JSON.parse(response);
                pricingData1.price = jsondata.priceList[0].formattedDiscountPrice;
                pricingData1.price = parseFloat(pricingData1.price.replace('$', ''));
                pricingData1.pharmacy = jsondata.priceList[0].pharmacy.pharmacyName;
                //console.log("price="+pricingData1.price);
                const query2 = 'INSERT INTO public_price(average_price, createdat, difference, drug_details_id, lowest_market_price, pharmacy, price, program_id, recommended_price) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *';
                const values = [pricingData1.average_price, pricingData1.createdat, pricingData1.difference, drugUrlList.rows[0].drug_id, pricingData1.lowest_market_price,pricingData1.pharmacy,pricingData1.price,pricingData1.program_id,pricingData1.recommended_price];
                await client.query(query2, values)
                    .then(res => {
                    })
                    .catch(e => {console.log(e)})
            })
            .catch(function (err) {
                console.log(err)
            });
        }else{continue}
    }
}
//exports.myhandler();