const services = require("../data/services"); //import mock data, //TODO: replace w/ real data later




function getServices(req, res) {
  res.json(services); //return list + attirbutes of all services
}



//export controller functions
module.exports = {
  getServices,
};