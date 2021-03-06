'use strict';

let course = {};
let models = require('./models/index.js');
let user = require('./user.js');
//TODO: Some duplication in methods
//Maybe we don't need a method for courses and templates
//Some required, not all.
course.createCourse = (req,res) => {
	let model = req.body;
	model.template = false;
	model.created_at = +new Date();
	model.test = [];

	if (model.instructor !== undefined) {
		model.students = [model.instructor];
	}

	new models.course(model).save((err,doc) => {
		if(err) {
			res.send({
				error: err
			});
		}
		else {
			res.send({
				course: doc
			});
		}
	});
};

course.createTemplate = (req,res) => {
	let model = req.body;
	model.template = true;
	model.created_at = +new Date();
	new models.course(model).save((err,doc) => {

		if(err) {
			res.send({
				error: err
			});
		}
		else {
			res.send({
				course: doc
			});
		}
	});
};

course.getTemplates = (req,res) => {
	models.course.find({"template": true},{ '__v': 0,students:0} , (err,docs) => {
		if(err) {
			res.send({
				error: err
			});
		}
		else {
			res.send({
				course: docs
			});
		}
	});
};

course.getTemplate = (req,res) => {
	let templateId = req.params.id;
	models.course.findOne({_id:templateId}, {__v: 0,_id:0,students:0},(err,doc) => {
		if(err) {
			res.send({
				error: err
			});
		}
		else {
			models.course.populate(doc,{
				path: 'sections',
			},(err,populatedDocs) => {
				if(err) {
					res.send({
						error: err
					});
					return;
				}
				models.section.populate(populatedDocs.sections,{
					path: 'lessons'
				},(err,populatedLesson) => {
					if(err) {
						res.send({
							error: err
						});
						return;
					}
					res.send({
						course: populatedDocs
					});
				});
			});
		}
	}).populate('sections');
};

course.updateTemplate = (req,res) => {
	let templateId = req.params.id;
	let model = req.body;

	model.updated_at = +new Date();

	models.course.findOneAndUpdate(
		{_id:templateId},
		model,
		{new: true},
		(err,doc) => {
			if(err) {
				res.send({
					error: err
				});
			}
			else {
				res.send({
					course: doc
				});
			}
		});
};

course.getCourses = (req,res) => {
	models.course.find({},{'__v': 0}, (err,docs) => {
		if(err) {
			res.send({
				error: err
			});
		}
		else {
			res.send({
				course: docs
			});
		}
	}).sort({
		created_at: -1
	});
};

course.getCourse = (req,res) => {
	let id = req.params.id;
	models.course.findOne({_id:id}, {'__v': 0},(err,doc) => {
		if(err) {
			res.send({
				error: err
			});
		}
		else {
			models.course.populate(doc,[
				{
					path: 'sections'
				},
				{
					path: 'students',
					select: 'firstName lastName email courseSections'
				}, 
				{
					path: 'tests'
				}
			],(err,populatedDocs) => {
				if(err) {
					res.send({
						error: err
					});
					return;
				}
				models.section.populate(populatedDocs.sections,{
					path: 'lessons',
					select: 'title'
				},(err,populatedLesson) => {
					if(err) {
						res.send({
							error: err
						});
						return;
					}
					res.send({
						course: populatedDocs
					});
				});
			});
		}
	});
};

course.updateCourse = (req,res) => {
	let model = req.body;
	let id = req.params.id;
	
	models.course.findOne({ _id:id },
		(err,doc) => {
			delete model._id;
		
			if(doc.sections) {
				model.sections = model.sections.map((obj) => obj._id);
			}

			model.updated_at = +new Date();
			Object.assign(doc,model);
			
			doc.save(err => {
				if(err){
					res.send({
						error: err
					});
				}
				else {
					res.send({
						course: doc
					});
				}
			})
	});
};

course.removeCourse = (req,res) => {
	let courseId = req.params.id;
	models.course.findOne({_id: courseId},(err,doc) => {
		if(err) {
			res.send({
				error: err
			});
		}
		else {
			doc.remove((err) => {
				if(err) {
					res.send({
						error:err
					});
				}
				else {
					res.send({
						course: []
					});
				}
			});	
		}
	});
};

course.addSection = (req,res) => {
	let courseId = req.params.courseId;
	let model = req.body;
	new models.section(model).save((err,sectionDoc) => {
		if(err) {
			res.send({
				error: err
			});
		}
		models.course.findOne({_id: courseId},{__v:0},(err,doc) => {
			doc.sections.push(sectionDoc._id);
			doc.save((err, savedDoc) => {
				models.section.populate(savedDoc, {path: 'sections'}, (err,courseWSections) => {
					if(err) {
						res.send({
							error: err
						});
						return;
					}
					res.send({
						course: savedDoc
					});

				});
			});
		});
	});
};

course.getSection = (req,res) => {
	let sectionId = req.params.sectionId;
	models.section.findOne({_id: sectionId}, (err,doc) => {
		if(err) {
			res.send({
				error: err
			});
			return;
		}
		res.send({
			section: doc
		});
	}).populate('lessons');
};

course.updateSection = (req,res) => {
	let sectionId = req.params.sectionId;
	let model = req.body;
	
	delete model._id;

	models.section.findOne({_id:sectionId},(err,doc) => {
		if(err) {
			res.send({
				error: err
			});
			return;
		}

		doc.lessons = model.lessons.map(lesson => lesson._id);

		doc.save((err,savedDoc) => {
			models.section.populate(savedDoc,{path: 'lessons'}, (err,populatedDoc) => {
				if(err) {
					res.send({
						error:err
					});
					return;
				}
				res.send({
					section: populatedDoc
				});
			});
		});
	});
};

course.removeSection = (req,res) => {
	let courseId = req.params.courseId;
	let sectionId = req.params.sectionId;

	models.course.findOne({_id:courseId},(err,doc) => {
		if(err) {
			res.send({
				error: err
			});
			return;
		}
		let sectionIndex = doc.sections.indexOf(sectionId);
		doc.sections.splice(sectionIndex,1);
		doc.save((err,newDoc) => {
			if(err) {
				res.send({
					error: err
				});
				return;
			}
			res.send({
				course: doc
			});
		});
 
	});
};

course.addLesson = (req,res) => {
	let lessonId = req.params.lessonId;
	let sectionId = req.params.sectionId;
	models.section.findOne({_id: sectionId}, (err,doc) => {
		let section = doc;
		section.updated_at = +new Date();
		if(err) {
			res.send({
				error: err
			});
		}
		else {
			section.lessons.push(lessonId);
			section.save((err,doc) => {
				if(err) {
					res.send({
						error: err
					});
				}
				else {
					models.section.populate(doc,{path:'lessons'},(err, sectionWLesson) => {
						res.send({
							section: sectionWLesson
						});
					});
				}
			});
		}
	});
};

course.removeLesson = (req,res) => {
	let sectionId = req.params.sectionId;
	let lessonId = req.params.lessonId;
	models.section.findOne({_id:sectionId}, (err,doc) => {
		let section = doc;     
		section.updated_at = +new Date();
		if(err) {
			res.send({
				error: err
			});
		}
		else {
			let lessonIndex = section.lessons.indexOf(lessonId);
			section.lessons.splice(lessonIndex,1);
			section.save((err,doc) => { 
				res.send({
					section: doc
				});
			})
		}
	});
};

course.addUser = (req,res) => {
	let courseId = req.params.courseId;
	let emails = req.body.emails;

	models.course.findOne({_id: courseId},(err,doc) => {
		if(err) {
			res.send({
				error: err
			});
			return;
		}
		if(!doc.students) {
			doc.students = [];
		}
		const courseSections = {
			courseId: doc._id,
			sections: doc.sections
		};
		let users = emails.split(',').map((email) => {
			//Normalize email.
			email = email.toLowerCase().trim();
			return new Promise((resolve,reject) => {
				models.user.findOne({email: email}, (err,userDoc) => {
					// If user exists, add to class
					let studentExists = userDoc ? doc.students.indexOf(userDoc._id) : -1;
					if(studentExists >= 0) {
						//Return false if the student is already in the class.
						resolve(false);
					}
					//If you can find a user in the DB just push them on the course
					else if(userDoc) {
						if(userDoc.courseSections === undefined) {
							userDoc.courseSections = [];
						}
						userDoc.courseSections.push(courseSections);
						userDoc.save((err,savedUser) => {
							if(err !== null) {
								reject();
							}
							doc.students.push(userDoc._id);
							resolve(userDoc._id);
						})
					}
					else {
						// Else create new users and add to course
						Promise.all( user.createUser(email) ).then(data => {
							data[0].courseSections = [];
							data[0].courseSections.push(courseSections);
							data[0].save((err,savedUser) => {
								doc.students.push(data[0]._id);
								resolve(data[0]._id);
							});
						});
					}
				});
			});
		});

		Promise.all(users).then(data => {
			doc.save((err) => {
				if(err) {
					res.send({
						error: err
					})
					return;
				}
				let students = data.filter((student) => {
					if(student) {
						return user.addCourse(student,courseId);
					}
				});
				Promise.all(students).then((data) => {
					models.course.populate(doc, {path: 'students', select: 'firstName lastName email courseSections'},(err,courseWStudents) => {
						if(err) {
							res.send({
								error: err
							});
							return;
						}
						res.send({
							course: courseWStudents
						});
					});
				},(err) => {
					res.send({
						error: err
					});
				});
			});
		});
	});
};

course.removeUser = (req,res) => {
	let userId = req.params.userId;
	let courseId = req.params.courseId;
	models.course.findOne({_id: courseId}, (err,doc) => {
		if(err) {
			res.send({
				error: err
			});
			return;
		}
		let studentIndex = doc.students.indexOf(userId);
		user.removeCourse(userId,courseId)
			.then(() => {
				doc.students.splice(studentIndex,1);
				doc.save((err) => {
					if(err) {
						res.send({
							error: err
						});
						return;
					}
					models.course.populate(
						doc, 
						{ path: 'students', select: 'firstName lastName email courseSections'}, 
						(err,courseWStudents) => {
							if(err) {
								res.send({
									error: err
								});
								return;
							}
							res.send({
								course: courseWStudents
							});
						});
				});
			})
			.catch((error) => {
				res.send({
					error: err
				});
			});
	});
};


module.exports = course;





