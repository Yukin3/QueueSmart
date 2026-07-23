const services = require("../data/services"); //import mock data, //TODO: replace w/ real data later



//return list + attirbutes of all services
function getServices(req, res) {
    const {adminId, organizationId, status, priority, sort} = req.query;

    let result = [...services];


//*filters
    //by admin owner
    if (adminId) {
        result = result.filter((service) => service.adminId === adminId);  //show services with matching admin
    }


    //by linked org
    if (organizationId) {
        result = result.filter((service) => service.organizationId === organizationId); //show services with matching org
    }


    //by priority 
    if (priority) {
    const normalPriority = priority.toLowerCase().trim();


    if (!["low", "medium", "high"].includes(normalPriority)) {
        return res.status(400).json({error: "Invalid priority, use low, medium, or high."}); //handle invalid option
    }

    result = result.filter((service) => service.priority === normalPriority); //show services with matching priority
    
    }


    //by avail. status 
    if (status) {
        if (!["open", "closed"].includes(status)) {
            return res.status(400).json({error: "Invalid status, use open or closed."});  //handle invalid option
        }

        result = result.filter((service) =>status === "open" ? service.isOpen : !service.isOpen );  //show services with matching status
    }




//*sorting
    if (sort) {
        if (!["name", "duration", "priority"].includes(sort)) {
            return res.status(400).json({error: "Invalid sort option. Use name, duration, or priority."}); //hande invalid option
        }


        
        if (sort === "name") {
            result.sort((a, b) => a.name.localeCompare(b.name)); //sort by name in alpha order
        }



        if (sort === "duration") {
            result.sort((a, b) => a.expectedDuration - b.expectedDuration); //sort in increasinng duration order
        }



        if (sort === "priority") {
            const priorityNumber = { high: 1, medium: 2, low: 3 }; //give each priority a nummber value
            
            result.sort((a, b) => priorityNumber[a.priority] - priorityNumber[b.priority]); //sort highest priority first
        }
    }


    res.json(result);

}

//create and validate new service object
function createService(req, res) {
    const { name, description, expectedDuration, priority, adminId, organizationId } = req.body; //extract fields from req body
    const normalPriority = priority?.toLowerCase().trim();
    const errors = {}; //init validation error list


    //confirm name given + lenght within limit
    if (!name || !name.trim()) {
        errors.name = "Name is required.";
    } else if (name.trim().length > 100) {
        errors.name = "Service name cannot exceed 100 characters.";
    }


    //confirm descr. given + lenght within limit
    if (!description || !description.trim()) {
        errors.description = "Description is required.";
    } else if (description.trim().length > 1000) {
        errors.description = "Service description cannot exceed 1000 characters.";
    }




    const duration = Number(expectedDuration);

    //confirm duration included + whole number within range
    if (expectedDuration === undefined || expectedDuration === "") {
        errors.expectedDuration = "Expected duration is required.";
    } else if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
        errors.expectedDuration = "Expected duration must be a whole number from 1 to 480.";
    }




    //confirm priority among options
    if (!["low", "medium", "high"].includes(normalPriority)) {
        errors.priority = "Priority must be low, medium, or high.";
    }




    //return all validation erros if any fields invalid
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
        error: "Invalid service data.",
        details: errors,
        });
    }



    //init new service object
    const newService = {
        id: `svc-${Date.now()}`,
        organizationId: organizationId || "org-uh",
        adminId: adminId || "admin-001",
        name: name.trim(),
        description: description.trim(),
        expectedDuration: duration,
        priority: normalPriority,
        isOpen: false,
    };




    services.push(newService); //add new service to list of services


    //return success msg + new service object
    return res.status(201).json({
        message: "Service created successfully.",
        service: newService,
    });


}



function updateService(req, res) {
    const { serviceId } = req.params; //get service id from req params
    const { name, description, expectedDuration, priority, isOpen } = req.body;  //get update fields from req body
    const service = services.find((item) => item.id === serviceId);



    if (!service) {
        return res.status(404).json({error: "Service not found."}); //handle invalid service selection
    }



    const errors = {};


    //validate name if included in update req
    if (name !== undefined) {
        if (!name || !name.trim()) {
            errors.name = "Name cannot be empty.";
        } else if (name.trim().length > 100) {
            errors.name = "Service name cannot exceed 100 characters.";
        }
    }



    //validate description if inclduded in update req
    if (description !== undefined) {
        if (!description || !description.trim()) {
            errors.description = "Description cannot be empty.";
        } else if (description.trim().length > 1000) {
            errors.description = "Service description cannot exceed 1000 characters.";
        }
    }




    //validate description if inclduded in update req
    if (expectedDuration !== undefined) {
        const duration = Number(expectedDuration);

        if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
            errors.expectedDuration =
                "Expected duration must be a whole number from 1 to 480.";
        }
    }




    let normalizedPriority;
    //validate priority if inclduded in update req
    if (priority !== undefined) {
        normalizedPriority = priority.toLowerCase().trim();

        if (!["low", "medium", "high"].includes(normalizedPriority)) {
            errors.priority = "Priority must be low, medium, or high.";
        }
    }



    //validate availability if inclduded in update req
    if (isOpen !== undefined && typeof isOpen !== "boolean") {
        errors.isOpen = "isOpen must be true or false.";
    }




    //return validation errors
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            error: "Invalid service update data.",
            details: errors,
        });
    }



    //update the fields in the req
    if (name !== undefined) {
        service.name = name.trim();
    }

    if (description !== undefined) {
        service.description = description.trim();
    }

    if (expectedDuration !== undefined) {
        service.expectedDuration = Number(expectedDuration);
    }

    if (priority !== undefined) {
        service.priority = normalizedPriority;
    }

    if (isOpen !== undefined) {
        service.isOpen = isOpen;
    }




    //return updated service body
    return res.json({
        message: "Service updated successfully.",
        service,
    });


}




//export controller functions
module.exports = {
  getServices, createService, updateService
};