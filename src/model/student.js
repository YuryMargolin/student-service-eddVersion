import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
        _id: {type: Number, required: true},
        name: {type: String, required: true},
        password: {type: String, required: true},
        scores: {
            type: Map,
            key: String,
            of: Number,
            default: {}
        }
    }, {
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
                return ret;
            }
        },
        toObject: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
                return ret;
            }
        }
    }
);

const Student = mongoose.model('Student', studentSchema, 'college');
export default Student;
