const User = require("../models/User");
const Note = require("../models/Note");

const asyncHandler = require("express-async-handler");

// @desc Get all notes
// @route GET /notes
// @access Private

const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean();

  if (!notes?.length) {
    return res.status(400).json({ message: "Notes have not been found" });
  }

  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.userId).lean().exec();
      return { ...note, username: user.username };
    })
  );

  res.json(notesWithUser);
});

// @desc Create new note
// @route POST /notes
// @access Private

const createNewNote = asyncHandler(async (req, res) => {
  const { userId, title, text } = req.body;

  if (!userId || !title || !text) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const noteObject = { userId, title, text };

  const NewNote = await Note.create(noteObject);

  if (NewNote) {
    res.status(201).json({
      message: `Note with title: ${noteObject.title} has been created`,
    });
  } else {
    res.status(400).json({
      message: "Invalid note data has been provided!",
    });
  }
});

// @desc Update a note
// @route PATCH /notes
// @access Private

const updateNote = asyncHandler(async (req, res) => {
  const { id, title, text, userId, completed } = req.body;

  if (!id || !title || !text || !userId || typeof completed !== "number") {
    return res.status(400).json({ message: "All fields are required" });
  }

  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(400).json({ message: "There is no such a Note" });
  }

  note.user = userId;
  note.text = text;
  note.title = title;
  note.completed = completed;

  await note.save();

  const whoUpdatedNote = await User.findById(userId).lean().exec();

  res.json({ message: `Note was updated by ${whoUpdatedNote.username}` });
});

// @desc Delete a note
// @route DELETE /notes
// @access Private

const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Note ID required" });
  }

  const noteToBeDeleted = await Note.findById(id).exec();

  if (!noteToBeDeleted) {
    res.status(400).json({ message: "Ooops, that Note doesn't even exist!" });
  }

  await noteToBeDeleted.deleteOne();

  const reply = `Note with id : ${id} has been deleted!`;

  res.json(reply);
});

module.exports = {
  getAllNotes,
  updateNote,
  deleteNote,
  createNewNote,
};
