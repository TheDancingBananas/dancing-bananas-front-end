import { Box } from '@material-ui/core';

export const BananaHelp = (): JSX.Element => {
    return (
        <div>
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='space-around'
                className='main-content-container'
            >
                <Box className='banana-help-container'>
                    <h3>Banana Help</h3>
                </Box>
            </Box>
            <br />
        </div>
    );
};

export default BananaHelp;
