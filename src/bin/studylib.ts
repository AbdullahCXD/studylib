#!/usr/bin/env node

// Suppress Node.js warnings
process.removeAllListeners('warning');
process.env.NODE_NO_WARNINGS = '1';

import { Command } from 'commander';
import { StudyLibContext } from '../lib/StudylibContext';
import { Logger } from '../Logger';
import { Config } from '../lib/Config';
import { StudylibError } from '../lib/errors/StudylibError';
import figlet from 'figlet';
import clc from 'cli-color';

const logger = Logger.getInstance();
const config = Config.getInstance();

// Create beautiful title
console.log(
  clc.cyan(
    figlet.textSync("StudyLib", {
      font: "Big",
      horizontalLayout: "full",
    })
  )
);

const program = new Command();

program
  .name("studylib")
  .description("A Library that studies project installed libraries using AI modules")
  .version("1.0.0")
  .argument("<library>", "Library to study")
  .option("-p, --page <number>", "Page number", "1")
  .option("-i, --items-per-page <number>", "Items per page", config.defaultItemsPerPage.toString())
  .option("-t, --ai-tool <tool>", "AI tool to use (openai or gemini)", config.defaultAITool)
  .option("--no-warnings", "Suppress Node.js warnings", false)
  .action(async (library: string, options) => {
    try {
      // Handle warning suppression
      if (options.noWarnings) {
        process.env.NODE_NO_WARNINGS = '1';
      }

      const context = new StudyLibContext({
        aiTool: options.aiTool,
        page: parseInt(options.page, 10),
        itemsPerPage: parseInt(options.itemsPerPage, 10)
      });

      await context.study(library);
    } catch (error) {
      if (error instanceof StudylibError) {
        logger.error(`Error: ${error.message}`);
        if (error.details) {
          logger.debug(JSON.stringify(error.details));
        }
      } else {
        logger.error('An unexpected error occurred');
        if (error instanceof Error) {
          logger.debug(error.message);
        }
      }

      logger.error('AI service unavailable. Please try again later.');
      process.exit(1);
    }
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection');
  logger.debug(String(reason));
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception');
  logger.debug(error.message);
  process.exit(1);
});

program.parse();
