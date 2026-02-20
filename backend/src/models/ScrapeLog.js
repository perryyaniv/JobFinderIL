const mongoose = require('mongoose');

const scrapeLogSchema = new mongoose.Schema(
    {
        site: { type: String, required: true },
        status: { type: String, required: true },
        jobsFound: { type: Number, default: 0 },
        jobsNew: { type: Number, default: 0 },
        duration: { type: Number, default: 0 },
        error: { type: String, default: null },
        createdAt: { type: Date, default: Date.now },
    },
    {
        timestamps: false,
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

scrapeLogSchema.index({ site: 1 });
scrapeLogSchema.index({ createdAt: 1 });

module.exports = mongoose.model('ScrapeLog', scrapeLogSchema);
