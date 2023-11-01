const express = require('express');
const router = express.Router();
const passport = require('passport');
const { v4: uuidv4 } = require('uuid');
const LocalStrategy = require('passport-local').Strategy;

let User = require('../models/user');
let Complaint = require('../models/complaint');

const capitalizeFirstLetter = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1)
};

router.get('/', ensureAuthenticated, (req, res, next) => {
    res.render('index', {
        user: req.user,
        isAdmin: req.user.role === "admin",
        isUser: req.user.role === "user",
        isJeng: req.user.role === "jeng"
    });
});

router.get('/home', (req, res, next) => {
    res.render('home');
});
// router.get('/', (req, res, next) => {
//     res.render('home');
// });
router.get('/login', (req, res, next) => {
    res.render('login');
});

// Register Form
router.get('/register', (req, res, next) => {
    res.render('register');
});

// Logout
router.get('/logout', ensureAuthenticated, (req, res, next) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/home');
});

// Admin
router.get('/admin', ensureAuthenticated, async (req, res, next) => {
    try {
        const engineer = await User.getEngineers();
        const complaints = await Complaint.getActiveComplaints();
        complaints.map(item => {
            const assignedToDetails = engineer.find(enginnerItem => item.assignedTo === enginnerItem.uuid);
            item.status = item.status ? capitalizeFirstLetter(item.status) : ''
            item.desc = item.desc ? capitalizeFirstLetter(item.desc) : ''
            item.flat_no = item.flat_no ? capitalizeFirstLetter(item.flat_no) : ''
            item.assignedToName = assignedToDetails && assignedToDetails.name ? capitalizeFirstLetter(assignedToDetails.name) : ''
        });
        res.render('admin/admin', {
            complaints: complaints,
            complaintsActive: complaints.filter(item => item.status && item.status.toLowerCase() === "active" && (!item.assignedTo || item.assignedTo.length <= 0)),
            engineer: engineer,
        });
    } catch (error) {
        throw error;
    }
});
router.get('/AllComplaint', ensureAuthenticated, async (req, res, next) => {
    try {
        const engineer = await User.getEngineers();
        const complaints = await Complaint.getAllComplaints();
        complaints.map(item => {
            const assignedToDetails = engineer.find(enginnerItem => item.assignedTo === enginnerItem.uuid);
            item.status = item.status ? capitalizeFirstLetter(item.status) : ''
            item.desc = item.desc ? capitalizeFirstLetter(item.desc) : ''
            item.flat_no = item.flat_no ? capitalizeFirstLetter(item.flat_no) : ''
            item.assignedToName = assignedToDetails && assignedToDetails.name ? capitalizeFirstLetter(assignedToDetails.name) : ''
        });
        res.render('admin/allcomplaint', {
            complaints: complaints,
            // complaintsActive: complaints.filter(item => item.status && item.status.toLowerCase() === "active" && (!item.assignedTo || item.assignedTo.length <= 0)),
        });
    } catch (error) {
        throw error;
    }
});


// Assign the Complaint to Engineer
router.post('/assign', async (req, res, next) => {

    const complaintUuid = req.body.complaintUuid;
    const engineerUuid = req.body.engineerUuid;

    req.checkBody('complaintUuid', 'complaintID field is required').notEmpty();
    req.checkBody('engineerUuid', 'Enginner field is required').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        res.render('admin/admin', {
            errors: errors
        });
        return res;
    }
    try {
        await Complaint.updateComplaint(complaintUuid, { assignedTo: engineerUuid });
        req.flash('success_msg', 'You have successfully assigned a complaint to Engineer');
        res.redirect('/admin');
        return res;
    } catch (error) {
        if (err) throw err;
    }


});

// Junior Eng
router.get('/jeng', ensureAuthenticated, async (req, res, next) => {
    try {
        const complaints = await Complaint.getEngineerComplaints(req.user.uuid);
        complaints.map(item => {
            item.status = item.status ? capitalizeFirstLetter(item.status) : ''
            item.desc = item.desc ? capitalizeFirstLetter(item.desc) : ''
            item.flat_no = item.flat_no ? capitalizeFirstLetter(item.flat_no) : ''
            item.isActive = item.status && item.status.toLowerCase() === "active"
            item.route = 'jeng'
        });
        res.render('engineerComplaints', {
            complaints
        });
    } catch (error) {
        throw error;
    }
});

router.get('/jengpending', ensureAuthenticated, async (req, res, next) => {
    try {
        const complaints = await Complaint.getEngineerComplaints(req.user.uuid);
        const result = []
        complaints.map(item => {
            if (item.status && item.status.toLowerCase() === "active") {
                item.status = item.status ? capitalizeFirstLetter(item.status) : ''
                item.desc = item.desc ? capitalizeFirstLetter(item.desc) : ''
                item.flat_no = item.flat_no ? capitalizeFirstLetter(item.flat_no) : ''
                item.isActive = item.status && item.status.toLowerCase() === "active"
                item.route = 'jengpending'
                result.push(item);
            }
        });

        res.render('engineerComplaints', {
            complaints: result
        });
    } catch (error) {
        throw error;
    }
});

router.get('/complaint', ensureAuthenticated, (req, res, next) => {
    res.render('complaint', {
        username: req.session.user,
    });
});

//Register a Complaint
router.post('/registerComplaint', ensureAuthenticated, (req, res, next) => {
    const name = req.body.name;
    const Flat = req.body.flat;
    const email = req.body.email;
    const contact = req.body.contact;
    const desc = req.body.desc;

console.log(req.body)

    let errors = req.validationErrors();
    if (errors) {
        res.render('complaint', {
            errors: errors
        });
    } else {
        const newComplaint = new Complaint({
            uuid: uuidv4(),
            name:name,
            flat_no: Flat,
            email: email,
            contact: contact,
            desc: desc,
            userUuid: req.user.uuid
        });

        Complaint.registerComplaint(newComplaint, (err, complaint) => {
            if (err) throw err;
            req.flash('success_msg', 'You have successfully launched a complaint');
            res.redirect('/');
        });
    }
});


router.patch('/complaintUpdate', ensureAuthenticated, (req, res, next) => {
    const updateComplaintBody = req.body;
    console.log("updateComplaintBody", updateComplaintBody);
    let errors = req.validationErrors();
    if (errors) {
        res.render('complaint', {
            errors: errors
        });
    } else {
        Complaint.EditComplaint(updateComplaintBody, (err, complaint) => {
            if (err) throw err;
            req.flash('success_msg', 'You have successfully updated a complaint');
            res.redirect('/');

        });
    }
});

// Process Register
router.post('/register', (req, res, next) => {
    const name = req.body.name;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;
    const role = req.body.role;
    console.log(req.body)
    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Email must be a valid email address').isEmail();
    req.checkBody('username', 'Username field is required').notEmpty();
    req.checkBody('password', 'Password field is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
    req.checkBody('role', 'Role option is required').notEmpty();
    let errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors
        });
    } else {
        const newUser = new User({
            uuid: uuidv4(),
            name: name,
            username: username,
            email: email,
            password: password,
            role: role
        });

        User.registerUser(newUser, (err, user) => {
            if (err) {
                if (err.code === 11000) {
                    let errors = [];
                    errors.push({ msg: 'This username or email is already taken.' });
                    res.render('register', {
                        errors: errors
                    });
                } else {
                    console.log("error", err);
                    res.render('register', {
                        err: err
                    });
                }
            } else {
                req.flash('success_msg', 'You are Successfully Registered and can Log in');
                res.redirect('/login');
            }
        });
    }
});

// Local Strategy
passport.use(new LocalStrategy((username, password, done) => {
    User.getUserByUsername(username, (err, user) => {
        if (err) throw err;
        if (!user) {
            return done(null, false, {
                message: 'No user found,Unauthorised User'
            })
        }

        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, {
                    message: 'Wrong Password ! please try again'
                });
            }
        });
    });
}));

passport.serializeUser((user, done) => {
    var sessionUser = {
        uuid: user.uuid,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
    }
    done(null, sessionUser);
});

passport.deserializeUser((user, done) => {
    User.getUserById(user.uuid, (err, sessionUser) => {
        done(err, sessionUser);
    });
});

// Login Processing
router.post('/login', passport.authenticate('local',
    {
        failureRedirect: '/login',
        failureFlash: true

    }), (req, res, next) => {
        console.log(req.body)
        req.session.save((err) => {
            if (err) {
                return next(err);
            }
            if (req.user.role === 'admin') {
                res.redirect('/');
            }
            else {
                res.redirect('/');
            }
        });
    });

// Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error_msg', 'You are not Authorized to view this page');
        res.redirect('/home');
    }
}

router.get('/status', ensureAuthenticated, (req, res, next) => {

    Complaint.getUserComplaints(req.user.uuid, (err, complaints) => {
        complaints.map(item => {
            item.status = item.status.charAt(0).toUpperCase() + item.status.slice(1)
            item.desc = item.desc.charAt(0).toUpperCase() + item.desc.slice(1)
            item.flat_no = item.flat_no.charAt(0).toUpperCase() + item.flat_no.slice(1)
        })
        res.render('complaintStatus', {
            complaints
        });
    })
});

router.post('/CloseTicket', ensureAuthenticated, async (req, res, next) => {
    console.log(req.body);

    req.checkBody('complaintUuid', 'complaintUuid field is required').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        res.redirect(`/${req.body.route}`);
        return;
    }
    try {
        const complaintUuid = req.body.complaintUuid;
        await Complaint.updateComplaint(complaintUuid, { status: 'closed' })
        res.redirect(`/${req.body.route}`);
    } catch (error) {
        if (err) throw err;
    }
})
module.exports = router;