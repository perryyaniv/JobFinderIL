const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        titleHe: { type: String, default: null },
        company: { type: String, default: null },
        companyVerified: { type: Boolean, default: false },
        location: { type: String, default: null },
        city: { type: String, default: null },
        region: { type: String, default: null },
        description: { type: String, default: null },
        descriptionHe: { type: String, default: null },
        jobType: { type: String, default: null },
        experienceLevel: { type: String, default: null },
        salary: { type: String, default: null },
        salaryMin: { type: Number, default: null },
        salaryMax: { type: Number, default: null },
        category: { type: String, default: null },
        skills: { type: [String], default: [] },
        url: { type: String, required: true, unique: true },
        sourceUrl: { type: String, required: true },
        sourceSite: { type: String, required: true },
        postedAt: { type: Date, default: null },
        scrapedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
        isRemote: { type: Boolean, default: false },
        isHybrid: { type: Boolean, default: false },
        duplicateOfId: { type: mongoose.Schema.Types.ObjectId, default: null },
        fingerprint: { type: String, default: null },
        hidden: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
        sentCV: { type: Boolean, default: false },
    },
    {
        timestamps: { createdAt: false, updatedAt: 'updatedAt' },
        toJSON: {
            virtuals: true,
            transform(doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
            },
        },
        toObject: {
            virtuals: true,
            transform(doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

// Indexes matching the original Prisma schema
jobSchema.index({ sourceSite: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ city: 1 });
jobSchema.index({ region: 1 });
jobSchema.index({ postedAt: 1 });
jobSchema.index({ fingerprint: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ hidden: 1 });
jobSchema.index({ isFavorite: 1 });
jobSchema.index({ sentCV: 1 });

module.exports = mongoose.model('Job', jobSchema);
