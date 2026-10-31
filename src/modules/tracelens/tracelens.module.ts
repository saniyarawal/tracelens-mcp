import { Module } from '@nitrostack/core';
import { TraceLensTools } from './tracelens.tools.js';

@Module({
  name: 'tracelens',
  description: 'Evidence-first website domain investigation',
  controllers: [TraceLensTools]
})
export class TraceLensModule {}