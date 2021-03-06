/**
 * A React component to view a PDF document
 *
 * @see https://react-pdf-viewer.dev
 * @license https://react-pdf-viewer.dev/license
 * @copyright 2019-2020 Nguyen Huu Phuoc <me@phuoc.ng>
 */

import React from 'react';

import Spinner from '../components/Spinner';
import ThemeContent from '../theme/ThemeContext';
import PdfJs from '../vendors/PdfJs';
import AskForPasswordState from './AskForPasswordState';
import AskingPassword from './AskingPassword';
import CompletedState from './CompletedState';
import './documentLoader.less';
import FailureState from './FailureState';
import LoadingState from './LoadingState';
import LoadingStatus, { VerifyPassword } from './LoadingStatus';
import WrongPassword from './WrongPassword';
import WrongPasswordState from './WrongPasswordState';

interface DocumentLoaderProps {
    file: PdfJs.FileData;
    render(doc: PdfJs.PdfDocument): React.ReactElement;
}

const DocumentLoader: React.FC<DocumentLoaderProps> = ({ file, render }) => {
    const theme = React.useContext(ThemeContent);
    const [status, setStatus] = React.useState<LoadingStatus>(new LoadingState(0));

    React.useEffect(() => {
        // If we don't reset the status when new `file` is provided
        // (for example, when opening file)
        // then we will see the error
        //  ```
        //  Invariant Violation: Rendered fewer hooks than expected.
        //  This may be caused by an accidental early return statement
        //  ```
        setStatus(new LoadingState(0));

        const loadingTask = PdfJs.getDocument(file);
        loadingTask.onPassword = (verifyPassword: VerifyPassword, reason: string): void => {
            switch (reason) {
                case PdfJs.PasswordResponses.NEED_PASSWORD:
                    setStatus(new AskForPasswordState(verifyPassword));
                    break;
                case PdfJs.PasswordResponses.INCORRECT_PASSWORD:
                    setStatus(new WrongPasswordState(verifyPassword));
                    break;
                default:
                    break;
            }
        };
        loadingTask.promise.then(
            (doc) => setStatus(new CompletedState(doc)),
            (err) => setStatus(new FailureState(err.message || 'Cannot load document')),
        );

        return (): void => {
            loadingTask.destroy();
        };
    }, [file]);

    switch (true) {
        case (status instanceof AskForPasswordState):
            return <AskingPassword verifyPasswordFn={(status as AskForPasswordState).verifyPasswordFn} />;
        case (status instanceof WrongPasswordState):
            return <WrongPassword verifyPasswordFn={(status as WrongPasswordState).verifyPasswordFn} />;
        case (status instanceof CompletedState):
            return render((status as CompletedState).doc);
        case (status instanceof FailureState):
            return (
                <div className={`${theme.prefixClass}-doc-error`}>
                    {(status as FailureState).error}
                </div>
            );
        case (status instanceof LoadingState):
        default:
            return (
                <div className={`${theme.prefixClass}-doc-loading`}>
                    <Spinner />
                </div>
            );
    }
};

export default DocumentLoader;
