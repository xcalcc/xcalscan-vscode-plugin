import * as path from 'path';
import { configure, getLogger } from 'log4js';
import * as date from './dateUtils';

class Logger {
    logger = getLogger('vscodeplugin');

    constructor(){
        const ymd = date.dateFormat(new Date, 'yyyy-MM-dd');
        const logFileFullPath = path.join(__dirname, '..', 'logs', `${ymd}.log`);

        configure({
            appenders: { vscodeplugin: { type: 'file', filename: logFileFullPath } },
            categories: { default: { appenders: ['vscodeplugin'], level: 'debug' } }
        });
    }

    trace(data: any) {
        this.logger.trace(data);
    }

    info(data: any, isTitle?: boolean) {
        if(isTitle) {
            data = '[' + String(data) + ']';
        }
        this.logger.info(data);
    }

    warn(data: any) {
        this.logger.warn(data);
    }

    error(data: any) {
        this.logger.error(data);
    }

    debug(data: any) {
        this.logger.debug(data);
    }

    fatal(data: any) {
        this.logger.fatal(data);
    }
}

export default new Logger();