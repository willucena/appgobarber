import React, { useCallback, useEffect, useState , useMemo } from 'react';
import Icon from 'react-native-vector-icons/Feather'
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useNavigation, useRoute } from '@react-navigation/native';
import { Platform, Alert } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../hooks/auth';

import { 
  Container, 
  Header,
  Content, 
  BackButton, 
  HeaderTitle, 
  UserAvatar, 
  ProvidersListContainer, 
  ProvidersList,
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
  Calendar,
  Title,
  OpenDatePickerButton,
  OpenDatePickerText,
  Schedule, 
  Section, 
  SectionTitle, 
  SectionContent, 
  Hour, 
  HourText,
  CreateAppointmentButton,
  CreateAppointmentButtonText
} from './styles';

interface RouteParams {
  providerId: string
}

export interface Provider {
  id: string;
  name: string;
  avatar_url: string;
}

interface AvailabilityItem {
  hour: number;
  available: boolean;
}
const CreateAppointment: React.FC = () => {
    const { user } = useAuth();
    const route = useRoute();
    const { goBack, navigate} = useNavigation();
    const navigation = useNavigation();
    // Ess cara é pra pegar os paramentros da url
    const params = route.params as RouteParams;

    const [showDatePicker , setShowDatePicker ] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedHour, setSelectedHour] = useState(0);

    const [ providers, setProviders ] = useState<Provider[]>([]);
    const [availability , setAvailability ] = useState<AvailabilityItem[]>([]);

    // State que define se o provider (cabeleireiro) foi selecionado ou não
    const [selectedProvider, setSelectedProvider] = useState(params.providerId);
    const minimumDate = useMemo(() => {
      const today = new Date();
  
      if (today.getHours() >= 17) {
        return new Date(today.setDate(today.getDate() + 1));
      }
  
      return today;
    }, []);
    useEffect(()=> {
      api.get('providers').then((response) => {
        setProviders(response.data)
      })
    },[])


    useEffect(()=> {
      api.get(`/providers/${selectedProvider}/day-availability`, {
        params: {
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1, // sempre soma o mês mais 1 porque o javascript começa contar os meses a partir de 0
          day: selectedDate.getDate(),
        }
      }).then((response) => {
        setAvailability(response.data);
        setSelectedHour(0);
      })
    },[selectedDate, selectedProvider])

    const navigateBack = useCallback(() => {
        goBack()
      },
      [goBack],
    );

    const handleSelectProvider = useCallback((providerId: string) => {
          setSelectedProvider(providerId)
    },[])

    const handleToggleDatePicker = useCallback(() => {
      setShowDatePicker(state => !state)
    },[])

    const handleDateChanged = useCallback((event: any , date: Date | undefined) => {
      if(Platform.OS === 'android'){
        setShowDatePicker(false)
      }

      if(date){
        setSelectedDate(date)
      }
    },[]);

    const handleSelectHour = useCallback((hour: number) => {
      setSelectedHour(hour);
    },[]);

    const handleCreateAppointment = useCallback(async () => {
        try{
          const date = new Date(selectedDate);
          date.setHours(selectedHour);
          date.setMinutes(0);

          await api.post('appointments', {
            provider_id: selectedProvider,
            date,
          });
          
          navigation.navigate('AppointmentCreated', { date: date.getTime() });
        }catch(error){
            Alert.alert(
              'Error ao criar agendmaento',
              'Ocorreu um erro ao tentar criar o agendamento, tente novamente'
            )
        }
      },[selectedProvider, selectedDate, selectedHour, navigation])

    const morningAvailability = useMemo(() => {
        return availability
            .filter(({hour}) => hour < 12)
            .map(({ hour, available }) => {
              return {
              hour,
              available,
              hourFormatted: format(new Date().setHours(hour), 'HH:00'),
              }
            });
    },[availability]);

    const afternonAvailability = useMemo(() => {
      return availability.filter(({hour}) => hour >= 12)
          .map(({ hour, available }) => {
            return {
              hour,
              available,
              hourFormatted: format(new Date().setHours(hour), 'HH:00'),
            };
          });
    },[availability]);
  return (
   <Container>
     <Header>
       <BackButton onPress={()=> navigateBack()}>
          <Icon name="chevron-left" size={24} color="#999591"/>
       </BackButton>

       <HeaderTitle>Cabeleireiros</HeaderTitle>
        <UserAvatar source={{ uri: user.avatar_url}}/>
     </Header>
     <Content>
     <ProvidersListContainer>
     <ProvidersList 
      horizontal
      showsHorizontalScrollIndicator={false}
      data={providers}
      keyExtractor={provider => provider.id}
      renderItem={({item: provider}) => (
        <ProviderContainer
        onPress={()=> handleSelectProvider(provider.id)}
        selected={provider.id === selectedProvider}
        >
          <ProviderAvatar source={{uri: provider.avatar_url}}/>
          <ProviderName
          selected={provider.id === selectedProvider}
          >{provider.name}</ProviderName>
        </ProviderContainer>
      )}
     />
     </ProvidersListContainer>
        <Calendar>
          <Title>Escolha a data</Title>
          <OpenDatePickerButton onPress={handleToggleDatePicker}>
              <OpenDatePickerText>Selecionar outra data</OpenDatePickerText>
          </OpenDatePickerButton>
          {/** só mostra os datetimerpicker se showDatePicker for true */}
          {showDatePicker && <DateTimePicker 
            mode='date'
            display="spinner"
            textColor='#f4ede8'
            onChange={(_, date) => date && setSelectedDate(date)}
            value={selectedDate}
            minimumDate={minimumDate}
            />}
        </Calendar>

        <Schedule>
        <Title>Escolha o horário</Title>
        <Section> 
            <SectionTitle>Manhã</SectionTitle>
            <SectionContent horizontal>
            {morningAvailability.map(({ hour,  available , hourFormatted }) =>(
              <Hour 
               enabled={available}
               selected={ hour === selectedHour } 
               available={available} 
               key={hourFormatted} 
               onPress={() =>  handleSelectHour(hour)}
               >
              <HourText selected={ hour === selectedHour }  >{hourFormatted }</HourText>
              </Hour>
            ))}
        </SectionContent>
        </Section>
          <Section> 
            <SectionTitle>Tarde</SectionTitle>
            <SectionContent horizontal >
            {afternonAvailability.map(({hour,  available , hourFormatted}) =>(
               <Hour  
               enabled={available} 
               selected={ hour === selectedHour } 
               available={available} 
               key={hourFormatted}
               onPress={() => handleSelectHour(hour)}
               >
               <HourText selected={hour === selectedHour}>
                 {hourFormatted }
              </HourText>
             </Hour>
            ))}
            </SectionContent>
          </Section>
        </Schedule>
        <CreateAppointmentButton onPress={() => handleCreateAppointment()}>
          <CreateAppointmentButtonText>
            Agendar
          </CreateAppointmentButtonText>
        </CreateAppointmentButton>
     </Content>
   </Container>
  )
}

export default CreateAppointment;
