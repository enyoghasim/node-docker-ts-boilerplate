import { getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import '@/dtos';

export function buildSpec(routePrefix = '/api/v1') {
  const storage = getMetadataArgsStorage();

  const generatedSchemas = validationMetadatasToSchemas({
    refPointerPrefix: '#/components/schemas/',
  });

  return routingControllersToSpec(
    storage,
    { routePrefix },
    {
      info: {
        title: 'API Documentation',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: process.env.SESSION_COOKIE_NAME || 'sid',
          },
        },
        schemas: {
          ...generatedSchemas,
        },
      },
    }
  );
}

export default buildSpec;
