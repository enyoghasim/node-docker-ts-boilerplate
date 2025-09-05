import path from 'path';
import dotenv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const ENV_PATH = NODE_ENV === 'development' ? '.env.development.local' : '.env';

// Resolve relative to project root to be safe when files are loaded from different CWDs
const resolvedPath = path.resolve(process.cwd(), ENV_PATH);
console.log(resolvedPath);

dotenv.config({ path: resolvedPath });

// Ensure NODE_ENV is available to other modules
process.env.NODE_ENV = NODE_ENV;

export { NODE_ENV, ENV_PATH, resolvedPath };
