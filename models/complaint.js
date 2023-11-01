const mongoose = require('mongoose')
const dbconnect = require('../db')

//Call the db to connect the mongo db
dbconnect()

// Complaint Schema
const ComplaintSchema = mongoose.Schema({
    uuid: {
        type: String
    },
    name: {
        type: String
    },
    flat_no: {
        type: String
    },
    email: {
        type: String
    },
    contact: {
        type: String
    },
    desc: {
        type: String
    },
    userUuid: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    assignedTo: {
        type: String
    }
});

const Complaint = module.exports = mongoose.model('Complaint', ComplaintSchema);

module.exports.registerComplaint = function (newComplaint, callback) {
    newComplaint.save(callback);
}

module.exports.getAllComplaints = async () => {
    const result = await Complaint.find();
    return result;
}
module.exports.getActiveComplaints = async () => {
    const result = await Complaint.find({ status: "active" }); // Use an object as an argument to specify the query criteria
    return result;
}


module.exports.EditComplaint = (updateComplaint, callback) => {
    const updatedData = {
        flat_no: updateComplaint.flat,
        email: updateComplaint.email,
        desc: updateComplaint.desc,
        contact: updateComplaint.contact
    };
    console.log("updatedData", updatedData);
    Complaint.findOneAndUpdate({ name: updateComplaint.name }, updatedData, {
        new: true,
        runValidators: true
    }, (err, complaint) => {
        if (err) {
            console.error('Error in updating complaint:', error);
            callback(err, null); // Pass the error to the callback
        } else {
            if (!complaint) {
                const notFoundError = new Error('Complaint not found');
                console.error('Error in updating complaint:', notFoundError);
                callback(notFoundError, null); // Handle the case where the complaint is not found
            } else {
                callback(null, complaint); // Pass the updated complaint to the callback
            }
        }
    });
};


module.exports.getUserComplaints = function (userUuid, callback) {
    Complaint.find({ userUuid }, callback);
}

module.exports.updateComplaint = async (uuid, update) => {
    return Complaint.findOneAndUpdate({ uuid }, { $set: update }, { new: true, passRawResult: true });
}

module.exports.getEngineerComplaints = async (complaintUuid) => {
    return Complaint.find({ assignedTo: complaintUuid })
}