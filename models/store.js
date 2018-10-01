const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: 'Please enter a store name!',
		},
		slug: String,
		description: {
			type: String,
			trim: true,
		},
		tags: [String],
		created: {
			type: Date,
			default: Date.now(),
		},
		photo: String,
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: 'You must supply an author',
		},
		location: {
			type: {
				type: String,
				default: 'Point',
			},
			coordinates: [
				{
					type: Number,
					required: 'You must supply coordinates!',
				},
			],
			address: {
				type: String,
				required: 'You must supply an address',
			},
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Define our indexes
storeSchema.index({
	name: 'text',
	description: 'text',
});

storeSchema.index({
	location: '2dsphere',
});

storeSchema.pre('save', async function(next) {
	if (!this.isModified('name')) {
		return next();
	}
	this.slug = slug(this.name);
	// find stores with slug ex, ex-1, ex-2
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
	const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
	if (storesWithSlug.length) {
		this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
	}
	next();
});

storeSchema.statics.getTagsList = function() {
	return this.aggregate([
		{ $unwind: '$tags' },
		{
			$group: {
				_id: '$tags',
				count: { $sum: 1 },
			},
		},
		{ $sort: { count: -1 } },
	]);
};
storeSchema.statics.getTopStores = function() {
	return this.aggregate([
		// lookup stores and populate reviews
		{ $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' } },
		// filter for items that have 2 or more reviews
		{ $match: { 'reviews.1': { $exists: true } } },
		{
			$addFields: {
				averageRating: { $avg: '$reviews.rating' },
			},
		},
		// sort it by our new FileReader, highest reviews first
		{ $sort: { averageRating: -1 } },
		// limit it to ten
		{ $limit: 10 },
	]);
};

storeSchema.virtual('reviews', {
	ref: 'Review',
	localField: '_id',
	foreignField: 'store',
});

function autopopulate(next) {
	this.populate('reviews');
	next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
