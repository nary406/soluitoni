const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());
const db_path = path.join(__dirname, "covid19India.db");
let db = null;
const initilizeDB_and_server = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initilizeDB_and_server();

app.get("/states/", async (request, response) => {
  const all_data_query = `
    SELECT * 
    FROM 
    state;
    `;

  const my_response = await db.all(all_data_query);

  const all_function = (state_list) => {
    return {
      stateId: state_list.state_id,
      stateName: state_list.state_name,
      population: state_list.population,
    };
  };
  response.send(my_response.map((each) => all_function(each)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const single_data_query = `
    SELECT * 
    FROM 
    state
    WHERE 
    state_id=${stateId}
    `;
  const single_state = (states_list) => {
    return {
      stateId: states_list.state_id,
      stateName: states_list.state_name,
      population: states_list.population,
    };
  };

  const db_response = await db.get(single_data_query);
  response.send(single_state(db_response));
});

app.post("/districts/", async (request, response) => {
  const body_details = request.body;

  const { districtName, stateId, cases, cured, active, deaths } = body_details;

  const insert_data_query = `INSERT INTO
    district 
    (district_name, state_id, cases, cured, active, deaths )
    VALUES 
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
   
    `;

  const db_response = await db.run(insert_data_query);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const data_query = `
    SELECT * 
    FROM 
    district
    WHERE 
    district_id=${districtId}
    `;
  const ans_function = (state_list) => {
    return {
      districtId: state_list.district_id,
      districtName: state_list.district_name,
      stateId: state_list.state_id,
      cases: state_list.cases,
      cured: state_list.cured,
      active: state_list.active,
      deaths: state_list.deaths,
    };
  };

  const db_response = await db.get(data_query);
  response.send(ans_function(db_response));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const data_query = `
    DELETE
    FROM 
    district
    WHERE 
    district_id=${districtId}
    `;

  await db.run(data_query);
  response.send("District Removed");
});

app.put("/districts/:districtId", async (request, response) => {
  const body_details = request.body;
  const { districtId } = request.params;

  const { districtName, stateId, cases, cured, active, deaths } = body_details;

  const update_data_query = `UPDATE
    district 
    SET
    district_name='${districtName}',
    state_id= ${stateId},
    cases=${cases},
    cured= ${cured},
    active= ${active},
    deaths=${deaths}
    WHERE 
    district_id=${districtId}
    
   
    `;

  const db_response = await db.run(update_data_query);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const data_query = `
    SELECT sum(cases),sum(cured), sum(active), sum(deaths)
    FROM 
    district
    WHERE 
    state_id=${stateId}
    `;

  const db_response = await db.get(data_query);
  response.send({
    totalCases: db_response["sum(cases)"],
    totalCured: db_response["sum(cured)"],
    totalActive: db_response["sum(active)"],
    totalDeaths: db_response["sum(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const data_query = `
    SELECT state_id 
    FROM 
    district
    WHERE 
    district_id=${districtId}
    `;
  const db_response = await db.get(data_query);
  const data_2_quary = `
 SELECT state_name 
    FROM 
    state
    WHERE 
    state_id=${db_response["state_id"]}
    `;

  const db_resp_2 = await db.get(data_2_quary);

  response.send({
    stateName: db_resp_2["state_name"],
  });
});
module.exports = app;
