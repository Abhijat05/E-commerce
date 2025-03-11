import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  B2B_CUSTOMER = 'b2b_customer',
  B2C_CUSTOMER = 'b2c_customer',
}

export enum BusinessType {
  RETAILER = 'retailer',
  WHOLESALER = 'wholesaler',
  DISTRIBUTOR = 'distributor',
  MANUFACTURER = 'manufacturer',
  OTHER = 'other',
}

// Define interface for better TypeScript support
export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  companyName?: string;
  businessType?: BusinessType;
  taxId?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define interface for the User model
interface IUserModel extends Model<IUser> {
  // Add any static methods here if needed
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.B2C_CUSTOMER,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  // B2B specific fields - make them optional in the schema
  companyName: {
    type: String,
  },
  businessType: {
    type: String,
    enum: [...Object.values(BusinessType), null, undefined],
  },
  taxId: {
    type: String,
  },
  // Additional fields
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Custom validation to make fields required only for B2B customers
userSchema.pre('validate', function(this: IUser, next) {
  if (this.role === UserRole.B2B_CUSTOMER) {
    if (!this.companyName) {
      this.invalidate('companyName', 'Company name is required for B2B customers');
    }
    
    if (!this.businessType) {
      this.invalidate('businessType', 'Business type is required for B2B customers');
    }
    
    if (!this.taxId) {
      this.invalidate('taxId', 'Tax ID is required for B2B customers');
    }
  }
  next();
});

// Pre-save hook to hash password
userSchema.pre('save', async function(this: IUser, next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;