const Service = require("../models/Service"); // import MongoDB Service model


//mongo conversion helper
function formatService(service) {
  return {
    id: service._id.toString(),
    organizationId: service.organizationId,
    adminId: service.adminId,
    name: service.name,
    description: service.description,
    expectedDuration: service.expectedDuration,
    priority: service.priority,
    isOpen: service.isOpen,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

//return list + attirbutes of all services
async function getServices(req, res) {
    try {
    const {adminId, organizationId, status, priority, sort} = req.query;

    const filter = {};


//*filters
    //by admin owner
    if (adminId) {
        filter.adminId = adminId;
    }


    //by linked org
    if (organizationId) {
        filter.organizationId = organizationId;
    }


    //by priority 
    if (priority) {
    const normalPriority = priority.toLowerCase().trim();


    if (!["low", "medium", "high"].includes(normalPriority)) {
        return res.status(400).json({error: "Invalid priority, use low, medium, or high."}); //handle invalid option
    }

    filter.priority = normalPriority;
    
    }


    //by avail. status 
    if (status) {
        if (!["open", "closed"].includes(status)) {
            return res.status(400).json({error: "Invalid status, use open or closed."});  //handle invalid option
        }

        filter.isOpen = status === "open";
    }   
    
    
    let result = await Service.find(filter);




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


    return res.json(result.map(formatService));
  
    } catch (error) {
        return res.status(500).json({
            error: "Failed to fetch services.",
            details: error.message,
        });
    }

}


//get individual service
async function getServiceById(req, res) {
    try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);


    if (!service) {
        return res.status(404).json({error: "Service not found."}); //handle nonexisting service
    }

    return res.json(formatService(service));
    } catch (error) {
        return res.status(400).json({
            error: "Invalid service ID.",
            details: error.message,
        });
    }

}


//create and validate new service object
async function createService(req, res) {
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

try {
    const newService = await Service.create({
        organizationId: organizationId || "org-uh",
        adminId: adminId || "admin-001",
        name: name.trim(),
        description: description.trim(),
        expectedDuration: duration,
        priority: normalPriority,
        isOpen: false,
    });

    return res.status(201).json({
        message: "Service created successfully.",
        service: formatService(newService),
    });
} catch (error) {
    return res.status(500).json({
        error: "Failed to create service.",
        details: error.message,
    });
}



}



async function updateService(req, res) {
    const { serviceId } = req.params; //get service id from req params
    const { name, description, expectedDuration, priority, isOpen } = req.body;  //get update fields from req body
    let service;

    try {
        service = await Service.findById(serviceId);
    } catch (error) {
        return res.status(400).json({
            error: "Invalid service ID.",
            details: error.message,
        });
    }

    if (!service) {
        return res.status(404).json({ error: "Service not found." });
    }


    const errors = {};
    const updates = {};

    //validate name if included in update req
    if (name !== undefined) {
        if (!name || !name.trim()) {
            errors.name = "Name cannot be empty.";
        } else if (name.trim().length > 100) {
            errors.name = "Service name cannot exceed 100 characters.";
        } else {
            updates.name = name.trim();
        }
    }



    //validate description if inclduded in update req
    if (description !== undefined) {
        if (!description || !description.trim()) {
            errors.description = "Description cannot be empty.";
        } else if (description.trim().length > 1000) {
            errors.description = "Service description cannot exceed 1000 characters.";
        } else {
            updates.description = description.trim();
        }
    }




    //validate description if inclduded in update req
    if (expectedDuration !== undefined) {
        const duration = Number(expectedDuration);

        if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
            errors.expectedDuration =
                "Expected duration must be a whole number from 1 to 480.";
        } else {
            updates.expectedDuration = duration;
        }
    }




    let normalizedPriority;
    //validate priority if inclduded in update req
    if (priority !== undefined) {
        normalizedPriority = priority.toLowerCase().trim();

        if (!["low", "medium", "high"].includes(normalizedPriority)) {
            errors.priority = "Priority must be low, medium, or high.";
        } else {
            updates.priority = normalizedPriority;
        }
    }



    //validate availability if inclduded in update req
    if (isOpen !== undefined) {
        if (typeof isOpen !== "boolean") {
            errors.isOpen = "isOpen must be true or false.";
        } else {
            updates.isOpen = isOpen;
        }
    }



    //return validation errors
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            error: "Invalid service update data.",
            details: errors,
        });
    }



    //update the fields in the req
try {
    const updatedService = await Service.findByIdAndUpdate(
        serviceId,
        { $set: updates },
        {
            returnDocument: "after",
            runValidators: true,
        }
    );

    return res.json({
        message: "Service updated successfully.",
        service: formatService(updatedService),
    });
} catch (error) {
    return res.status(500).json({
        error: "Failed to update service.",
        details: error.message,
    });
}

}



//delete an individual service
async function deleteService(req, res) {
    try {
    const { serviceId } = req.params;


    const deletedService = await Service.findByIdAndDelete(serviceId);

    if (!deletedService) {
        return res.status(404).json({ error: "Service not found." });
    }

    return res.json({
        message: "Service deleted successfully.",
        service: formatService(deletedService),
    });
   
    } catch (error) {
        return res.status(400).json({
            error: "Failed to delete service.",
            details: error.message,
        });
    }


}



//export controller functions
module.exports = {
  getServices, getServiceById, createService, updateService, deleteService
};